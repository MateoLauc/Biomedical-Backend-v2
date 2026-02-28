import { eq, and, or, not, isNull, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  users,
  refreshTokens,
  emailVerificationTokens,
  passwordResetTokens,
  userDevices
} from "../../db/schema/index.js";
import type { User, RefreshToken, EmailVerificationToken, PasswordResetToken } from "./types.js";

export type AdminUserListItem = {
  id: string;
  role: "super_admin" | "admin" | "customer";
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: Date | null;
  identityVerified: boolean;
  businessLicenseStatus: "not_submitted" | "pending" | "approved" | "rejected";
  prescriptionAuthorityStatus: "not_submitted" | "pending" | "approved" | "rejected";
  whoYouAre: string;
  stateOfPractice: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

export const authRepo = {
  async createUser(data: {
    firstName: string;
    lastName: string;
    whoYouAre: string;
    email: string;
    emailLower: string;
    phoneNumber: string;
    stateOfPractice: string;
    passwordHash: string;
    role?: "super_admin" | "admin" | "customer";
  }): Promise<User> {
    const insertData: typeof users.$inferInsert = { ...data };
    if (data.role) insertData.role = data.role;
    const [user] = await db
      .insert(users)
      .values(insertData)
      .returning();

    return user as User;
  },

  async findUserByEmail(emailLower: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.emailLower, emailLower)).limit(1);
    return (user as User) || null;
  },

  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
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

  async updateProfile(
    userId: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      whoYouAre: string;
      phoneNumber: string;
      stateOfPractice: string;
      email: string;
      emailLower: string;
      emailVerifiedAt: Date | null;
    }>
  ): Promise<User> {
    const set: { updatedAt: Date; firstName?: string; lastName?: string; whoYouAre?: string; phoneNumber?: string; stateOfPractice?: string; email?: string; emailLower?: string; emailVerifiedAt?: Date | null } = {
      updatedAt: new Date()
    };
    if (data.firstName !== undefined) set.firstName = data.firstName;
    if (data.lastName !== undefined) set.lastName = data.lastName;
    if (data.whoYouAre !== undefined) set.whoYouAre = data.whoYouAre;
    if (data.phoneNumber !== undefined) set.phoneNumber = data.phoneNumber;
    if (data.stateOfPractice !== undefined) set.stateOfPractice = data.stateOfPractice;
    if (data.email !== undefined) set.email = data.email;
    if (data.emailLower !== undefined) set.emailLower = data.emailLower;
    if (data.emailVerifiedAt !== undefined) set.emailVerifiedAt = data.emailVerifiedAt;

    const [user] = await db.update(users).set(set).where(eq(users.id, userId)).returning();
    return user as User;
  },

  async updateUserVerification(
    userId: string,
    data: Partial<{
      businessLicenseStatus: "not_submitted" | "pending" | "approved" | "rejected";
      prescriptionAuthorityStatus: "not_submitted" | "pending" | "approved" | "rejected";
    }>
  ): Promise<User> {
    const set: { updatedAt: Date; businessLicenseStatus?: "not_submitted" | "pending" | "approved" | "rejected"; prescriptionAuthorityStatus?: "not_submitted" | "pending" | "approved" | "rejected" } = {
      updatedAt: new Date()
    };
    if (data.businessLicenseStatus !== undefined) set.businessLicenseStatus = data.businessLicenseStatus;
    if (data.prescriptionAuthorityStatus !== undefined) set.prescriptionAuthorityStatus = data.prescriptionAuthorityStatus;
    const [user] = await db.update(users).set(set).where(eq(users.id, userId)).returning();
    return user as User;
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
  },

  async findDeviceByUserAndHash(userId: string, deviceHash: string) {
    const [row] = await db
      .select()
      .from(userDevices)
      .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceHash, deviceHash)))
      .limit(1);
    return row ?? null;
  },

  async createDevice(data: {
    userId: string;
    deviceHash: string;
    userAgent?: string;
  }) {
    const [device] = await db.insert(userDevices).values(data).returning();
    return device!;
  },

  async updateDeviceLastSeen(deviceId: string): Promise<void> {
    await db
      .update(userDevices)
      .set({ lastSeenAt: new Date() })
      .where(eq(userDevices.id, deviceId));
  },

  async listUsers(options?: {
    role?: "super_admin" | "admin" | "customer";
    identityVerified?: boolean;
    businessLicenseStatus?: "not_submitted" | "pending" | "approved" | "rejected";
    prescriptionAuthorityStatus?: "not_submitted" | "pending" | "approved" | "rejected";
    /** When "pending", return users whose credential status is pending (not both approved, not both rejected). */
    credentialStatus?: "pending";
    limit?: number;
    offset?: number;
  }): Promise<AdminUserListItem[]> {
    const conditions = [];
    if (options?.role) conditions.push(eq(users.role, options.role));
    if (options?.identityVerified !== undefined) conditions.push(eq(users.identityVerified, options.identityVerified));
    if (options?.credentialStatus === "pending") {
      const orPending = or(
        eq(users.businessLicenseStatus, "pending"),
        eq(users.businessLicenseStatus, "not_submitted"),
        eq(users.prescriptionAuthorityStatus, "pending"),
        eq(users.prescriptionAuthorityStatus, "not_submitted")
      );
      const notApproved = not(and(eq(users.businessLicenseStatus, "approved"), eq(users.prescriptionAuthorityStatus, "approved"))!);
      const notRejected = not(and(eq(users.businessLicenseStatus, "rejected"), eq(users.prescriptionAuthorityStatus, "rejected"))!);
      const a = orPending ?? sql`false`;
      const b = notApproved ?? sql`false`;
      const c = notRejected ?? sql`false`;
      const pendingCond = and(a, b as Parameters<typeof and>[0], c as Parameters<typeof and>[0]);
      if (pendingCond) conditions.push(pendingCond);
    } else {
      if (options?.businessLicenseStatus) conditions.push(eq(users.businessLicenseStatus, options.businessLicenseStatus));
      if (options?.prescriptionAuthorityStatus) conditions.push(eq(users.prescriptionAuthorityStatus, options.prescriptionAuthorityStatus));
    }

    let query = db
      .select({
        id: users.id,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        identityVerified: users.identityVerified,
        businessLicenseStatus: users.businessLicenseStatus,
        prescriptionAuthorityStatus: users.prescriptionAuthorityStatus,
        whoYouAre: users.whoYouAre,
        stateOfPractice: users.stateOfPractice,
        phoneNumber: users.phoneNumber,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return (await query) as AdminUserListItem[];
  },

  async countUsers(options?: {
    role?: "super_admin" | "admin" | "customer";
    identityVerified?: boolean;
    businessLicenseStatus?: "not_submitted" | "pending" | "approved" | "rejected";
    prescriptionAuthorityStatus?: "not_submitted" | "pending" | "approved" | "rejected";
    credentialStatus?: "pending";
  }): Promise<number> {
    const countConditions: ReturnType<typeof eq>[] = [];
    if (options?.role) countConditions.push(eq(users.role, options.role));
    if (options?.identityVerified !== undefined) countConditions.push(eq(users.identityVerified, options.identityVerified));
    if (options?.credentialStatus === "pending") {
      const orPending = or(
        eq(users.businessLicenseStatus, "pending"),
        eq(users.businessLicenseStatus, "not_submitted"),
        eq(users.prescriptionAuthorityStatus, "pending"),
        eq(users.prescriptionAuthorityStatus, "not_submitted")
      );
      const notApproved = not(and(eq(users.businessLicenseStatus, "approved"), eq(users.prescriptionAuthorityStatus, "approved"))!);
      const notRejected = not(and(eq(users.businessLicenseStatus, "rejected"), eq(users.prescriptionAuthorityStatus, "rejected"))!);
      const a = orPending ?? sql`false`;
      const b = notApproved ?? sql`false`;
      const c = notRejected ?? sql`false`;
      const pendingCond = and(a, b as Parameters<typeof and>[0], c as Parameters<typeof and>[0]);
      if (pendingCond) countConditions.push(pendingCond as ReturnType<typeof eq>);
    } else {
      if (options?.businessLicenseStatus) countConditions.push(eq(users.businessLicenseStatus, options.businessLicenseStatus));
      if (options?.prescriptionAuthorityStatus) countConditions.push(eq(users.prescriptionAuthorityStatus, options.prescriptionAuthorityStatus));
    }

    let query = db.select({ count: sql<number>`count(*)` }).from(users);
    if (countConditions.length > 0) {
      query = query.where(and(...countConditions)) as typeof query;
    }
    const [result] = await query;
    return Number(result?.count ?? 0);
  },

  async countPendingVerifications(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(or(eq(users.businessLicenseStatus, "pending"), eq(users.prescriptionAuthorityStatus, "pending")));
    return Number(result?.count ?? 0);
  },

  /** Users with both business license and prescription authority rejected. */
  async countRejectedUsers(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.businessLicenseStatus, "rejected"),
          eq(users.prescriptionAuthorityStatus, "rejected")
        )
      );
    return Number(result?.count ?? 0);
  },
};
