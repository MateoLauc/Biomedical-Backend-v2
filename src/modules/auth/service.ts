import type { users } from "../../db/schema";
import { authRepo } from "./repo";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import { generateToken, hashToken } from "../../lib/auth/tokens";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../lib/auth/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../lib/email";
import { badRequest, unauthorized, notFound } from "../../lib/http-errors";
import type { SignupInput, SigninInput, AuthTokens, PublicUser } from "./types";

function toPublicUser(user: typeof users.$inferSelect): PublicUser {
  return {
    id: user.id,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    identityVerified: user.identityVerified,
    businessLicenseStatus: user.businessLicenseStatus,
    prescriptionAuthorityStatus: user.prescriptionAuthorityStatus
  };
}

export const authService = {
  async signup(input: SignupInput): Promise<{ user: PublicUser; verificationToken: string }> {
    const emailLower = input.email.toLowerCase().trim();

    const existing = await authRepo.findUserByEmail(emailLower);
    if (existing) {
      throw badRequest("Email already registered");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await authRepo.createUser({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      whoYouAre: input.whoYouAre.trim(),
      email: input.email.trim(),
      emailLower,
      phoneNumber: input.phoneNumber.trim(),
      countryOfPractice: input.countryOfPractice.trim(),
      passwordHash
    });

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await authRepo.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    await sendVerificationEmail(user.email, token);

    return { user: toPublicUser(user), verificationToken: token };
  },

  async signin(input: SigninInput, ip?: string, userAgent?: string): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const emailLower = input.email.toLowerCase().trim();

    const user = await authRepo.findUserByEmail(emailLower);
    if (!user) {
      throw unauthorized("Invalid email or password");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw unauthorized("Invalid email or password");
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create placeholder record to get tokenId
    const tempToken = generateToken();
    const tempHash = hashToken(tempToken);
    const refreshTokenRecord = await authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: tempHash,
      expiresAt,
      ...(ip && { ip }),
      ...(userAgent && { userAgent })
    });

    // Generate JWT refresh token with tokenId
    const refreshTokenJWT = await generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenRecord.id
    });

    // Update with actual JWT hash
    const refreshTokenHash = hashToken(refreshTokenJWT);
    await authRepo.updateRefreshTokenHash(refreshTokenRecord.id, refreshTokenHash);

    return {
      user: toPublicUser(user),
      tokens: { accessToken, refreshToken: refreshTokenJWT }
    };
  },

  async verifyEmail(token: string): Promise<PublicUser> {
    const tokenHash = hashToken(token);
    const tokenRecord = await authRepo.findEmailVerificationTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw badRequest("Invalid or expired verification token");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw badRequest("Verification token has expired");
    }

    if (tokenRecord.usedAt) {
      throw badRequest("Verification token already used");
    }

    await authRepo.markEmailVerificationTokenUsed(tokenRecord.id);
    await authRepo.updateUserEmailVerified(tokenRecord.userId, new Date());

    const user = await authRepo.findUserById(tokenRecord.userId);
    if (!user) {
      throw notFound("User not found");
    }

    return toPublicUser(user);
  },

  async resendVerificationEmail(email: string): Promise<void> {
    const emailLower = email.toLowerCase().trim();
    const user = await authRepo.findUserByEmail(emailLower);

    if (!user) {
      return;
    }

    if (user.emailVerifiedAt) {
      return;
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await authRepo.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    await sendVerificationEmail(user.email, token);
  },

  async forgotPassword(email: string): Promise<void> {
    const emailLower = email.toLowerCase().trim();
    const user = await authRepo.findUserByEmail(emailLower);

    if (!user) {
      return;
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepo.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    await sendPasswordResetEmail(user.email, token);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const tokenRecord = await authRepo.findPasswordResetTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw badRequest("Invalid or expired reset token");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw badRequest("Reset token has expired");
    }

    if (tokenRecord.usedAt) {
      throw badRequest("Reset token already used");
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepo.updateUserPassword(tokenRecord.userId, passwordHash);
    await authRepo.markPasswordResetTokenUsed(tokenRecord.id);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await authRepo.findUserById(userId);
    if (!user) {
      throw notFound("User not found");
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw unauthorized("Current password is incorrect");
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepo.updateUserPassword(userId, passwordHash);
  },

  async refreshAccessToken(refreshTokenValue: string, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const payload = await verifyRefreshToken(refreshTokenValue);
    const tokenHash = hashToken(refreshTokenValue);
    const tokenRecord = await authRepo.findRefreshTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw unauthorized("Invalid refresh token");
    }

    if (tokenRecord.id !== payload.tokenId) {
      throw unauthorized("Invalid refresh token");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw unauthorized("Refresh token has expired");
    }

    if (tokenRecord.revokedAt) {
      throw unauthorized("Refresh token has been revoked");
    }

    const user = await authRepo.findUserById(payload.userId);
    if (!user) {
      throw notFound("User not found");
    }

    const newAccessToken = await generateAccessToken({
      userId: user.id,
      role: user.role,
      emailVerified: !!user.emailVerifiedAt
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create placeholder record to get tokenId
    const tempToken = generateToken();
    const tempHash = hashToken(tempToken);
    const newRefreshTokenRecord = await authRepo.createRefreshToken({
      userId: user.id,
      tokenHash: tempHash,
      expiresAt,
      ...(ip && { ip }),
      ...(userAgent && { userAgent })
    });

    // Generate JWT refresh token with tokenId
    const newRefreshTokenJWT = await generateRefreshToken({
      userId: user.id,
      tokenId: newRefreshTokenRecord.id
    });

    // Update with actual JWT hash
    const newRefreshTokenHash = hashToken(newRefreshTokenJWT);
    await authRepo.updateRefreshTokenHash(newRefreshTokenRecord.id, newRefreshTokenHash);

    await authRepo.revokeRefreshToken(tokenRecord.id, newRefreshTokenRecord.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenJWT
    };
  },

  async logout(refreshTokenValue: string): Promise<void> {
    const tokenHash = hashToken(refreshTokenValue);
    const tokenRecord = await authRepo.findRefreshTokenByHash(tokenHash);

    if (tokenRecord) {
      await authRepo.revokeRefreshToken(tokenRecord.id);
    }
  }
};
