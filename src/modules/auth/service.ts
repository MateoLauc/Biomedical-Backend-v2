import type { users } from "../../db/schema";
import { authRepo } from "./repo";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import { generateToken, hashToken } from "../../lib/auth/tokens";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../lib/auth/jwt";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNewDeviceEmail
} from "../../lib/email";
import { deviceHash, deviceDescription } from "../../lib/device";
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
    const phoneNumber = input.phoneNumber.trim();

    const existingByEmail = await authRepo.findUserByEmail(emailLower);
    if (existingByEmail) {
      throw badRequest("This email address is already registered. Please use a different email or sign in.");
    }

    const existingByPhone = await authRepo.findUserByPhoneNumber(phoneNumber);
    if (existingByPhone) {
      throw badRequest("This phone number is already registered. Please use a different phone number or sign in.");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await authRepo.createUser({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      whoYouAre: input.whoYouAre.trim(),
      email: input.email.trim(),
      emailLower,
      phoneNumber,
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
    await sendWelcomeEmail(user.email, user.firstName);

    return { user: toPublicUser(user), verificationToken: token };
  },

  async signin(input: SigninInput, ip?: string, userAgent?: string): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const emailLower = input.email.toLowerCase().trim();

    const user = await authRepo.findUserByEmail(emailLower);
    if (!user) {
      throw unauthorized("The email or password you entered is incorrect. Please try again.");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw unauthorized("The email or password you entered is incorrect. Please try again.");
    }

    const hash = deviceHash(ip, userAgent);
    const existingDevice = await authRepo.findDeviceByUserAndHash(user.id, hash);
    if (!existingDevice) {
      await authRepo.createDevice({
        userId: user.id,
        deviceHash: hash,
        ...(userAgent && { userAgent })
      });
      const timestamp = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC"
      });
      await sendNewDeviceEmail({
        email: user.email,
        deviceDescription: deviceDescription(userAgent),
        timestamp
      });
    } else {
      await authRepo.updateDeviceLastSeen(existingDevice.id);
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
      throw badRequest("This verification link is invalid or has expired. Please request a new verification email.");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw badRequest("This verification link has expired. Please request a new verification email.");
    }

    if (tokenRecord.usedAt) {
      throw badRequest("This verification link has already been used. Please sign in to your account.");
    }

    await authRepo.markEmailVerificationTokenUsed(tokenRecord.id);
    await authRepo.updateUserEmailVerified(tokenRecord.userId, new Date());

    const user = await authRepo.findUserById(tokenRecord.userId);
    if (!user) {
      throw notFound("We couldn't find your account. Please check your information and try again.");
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
      throw badRequest("This password reset link is invalid or has expired. Please request a new password reset email.");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw badRequest("This password reset link has expired. Please request a new password reset email.");
    }

    if (tokenRecord.usedAt) {
      throw badRequest("This password reset link has already been used. Please request a new one if you still need to reset your password.");
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepo.updateUserPassword(tokenRecord.userId, passwordHash);
    await authRepo.markPasswordResetTokenUsed(tokenRecord.id);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await authRepo.findUserById(userId);
    if (!user) {
      throw notFound("We couldn't find your account. Please check your information and try again.");
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw unauthorized("Your current password is incorrect. Please try again.");
    }

    const passwordHash = await hashPassword(newPassword);
    await authRepo.updateUserPassword(userId, passwordHash);
  },

  async refreshAccessToken(refreshTokenValue: string, ip?: string, userAgent?: string): Promise<AuthTokens> {
    const payload = await verifyRefreshToken(refreshTokenValue);
    const tokenHash = hashToken(refreshTokenValue);
    const tokenRecord = await authRepo.findRefreshTokenByHash(tokenHash);

    if (!tokenRecord) {
      throw unauthorized("Your session has expired. Please sign in again.");
    }

    if (tokenRecord.id !== payload.tokenId) {
      throw unauthorized("Your session has expired. Please sign in again.");
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw unauthorized("Your session has expired. Please sign in again.");
    }

    if (tokenRecord.revokedAt) {
      throw unauthorized("Your session has been ended. Please sign in again.");
    }

    const user = await authRepo.findUserById(payload.userId);
    if (!user) {
      throw notFound("We couldn't find your account. Please check your information and try again.");
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
