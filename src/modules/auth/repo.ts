import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import { users, refreshTokens, emailVerificationTokens, passwordResetTokens } from "../../db/schema";
import type { User, RefreshToken, EmailVerificationToken, PasswordResetToken } from "./types.js";

export const authRepo = {
  async createUser(data: {
    firstName: string;
    lastName: string;
    whoYouAre: string;
    email: string;
    emailLower: string;
    phoneNumber: string;
    countryOfPractice: string;
    passwordHash: string;
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(data)
      .returning();

    return user as User;
  },

  async findUserByEmail(emailLower: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.emailLower, emailLower)).limit(1);
    return (user as User) || null;
  },

  async findUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return (user as User) || null;
  },

  async updateUserEmailVerified(userId: string, timestamp: Date): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerifiedAt: timestamp,
        identityVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  },

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  },

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<RefreshToken> {
    const [token] = await db
      .insert(refreshTokens)
      .values(data)
      .returning();

    return token as RefreshToken;
  },

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [token] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
      .limit(1);

    return (token as RefreshToken) || null;
  },

  async updateRefreshTokenHash(tokenId: string, tokenHash: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ tokenHash })
      .where(eq(refreshTokens.id, tokenId));
  },

  async revokeRefreshToken(tokenId: string, replacedByTokenId?: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        replacedByTokenId: replacedByTokenId || null
      })
      .where(eq(refreshTokens.id, tokenId));
  },

  async createEmailVerificationToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    const [token] = await db
      .insert(emailVerificationTokens)
      .values(data)
      .returning();

    return token as EmailVerificationToken;
  },

  async findEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const [token] = await db
      .select()
      .from(emailVerificationTokens)
      .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), isNull(emailVerificationTokens.usedAt)))
      .limit(1);

    return (token as EmailVerificationToken) || null;
  },

  async markEmailVerificationTokenUsed(tokenId: string): Promise<void> {
    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, tokenId));
  },

  async createPasswordResetToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(data)
      .returning();

    return token as PasswordResetToken;
  },

  async findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
      .limit(1);

    return (token as PasswordResetToken) || null;
  },

  async markPasswordResetTokenUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenId));
  }
};
