import { eq, and, or, isNull, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { users, refreshTokens, emailVerificationTokens, passwordResetTokens, userDevices } from "../../db/schema";
export const authRepo = {
    async createUser(data) {
        const [user] = await db
            .insert(users)
            .values(data)
            .returning();
        return user;
    },
    async findUserByEmail(emailLower) {
        const [user] = await db.select().from(users).where(eq(users.emailLower, emailLower)).limit(1);
        return user || null;
    },
    async findUserByPhoneNumber(phoneNumber) {
        const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
        return user || null;
    },
    async findUserById(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return user || null;
    },
    async updateUserEmailVerified(userId, timestamp) {
        await db
            .update(users)
            .set({
            emailVerifiedAt: timestamp,
            identityVerified: true,
            updatedAt: new Date()
        })
            .where(eq(users.id, userId));
    },
    async updateUserPassword(userId, passwordHash) {
        await db
            .update(users)
            .set({
            passwordHash,
            updatedAt: new Date()
        })
            .where(eq(users.id, userId));
    },
    async updateProfile(userId, data) {
        const set = {
            updatedAt: new Date()
        };
        if (data.firstName !== undefined)
            set.firstName = data.firstName;
        if (data.lastName !== undefined)
            set.lastName = data.lastName;
        if (data.whoYouAre !== undefined)
            set.whoYouAre = data.whoYouAre;
        if (data.phoneNumber !== undefined)
            set.phoneNumber = data.phoneNumber;
        if (data.countryOfPractice !== undefined)
            set.countryOfPractice = data.countryOfPractice;
        if (data.email !== undefined)
            set.email = data.email;
        if (data.emailLower !== undefined)
            set.emailLower = data.emailLower;
        if (data.emailVerifiedAt !== undefined)
            set.emailVerifiedAt = data.emailVerifiedAt;
        const [user] = await db.update(users).set(set).where(eq(users.id, userId)).returning();
        return user;
    },
    async updateUserVerification(userId, data) {
        const set = {
            updatedAt: new Date()
        };
        if (data.businessLicenseStatus !== undefined)
            set.businessLicenseStatus = data.businessLicenseStatus;
        if (data.prescriptionAuthorityStatus !== undefined)
            set.prescriptionAuthorityStatus = data.prescriptionAuthorityStatus;
        const [user] = await db.update(users).set(set).where(eq(users.id, userId)).returning();
        return user;
    },
    async createRefreshToken(data) {
        const [token] = await db
            .insert(refreshTokens)
            .values(data)
            .returning();
        return token;
    },
    async findRefreshTokenByHash(tokenHash) {
        const [token] = await db
            .select()
            .from(refreshTokens)
            .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)))
            .limit(1);
        return token || null;
    },
    async updateRefreshTokenHash(tokenId, tokenHash) {
        await db
            .update(refreshTokens)
            .set({ tokenHash })
            .where(eq(refreshTokens.id, tokenId));
    },
    async revokeRefreshToken(tokenId, replacedByTokenId) {
        await db
            .update(refreshTokens)
            .set({
            revokedAt: new Date(),
            replacedByTokenId: replacedByTokenId || null
        })
            .where(eq(refreshTokens.id, tokenId));
    },
    async createEmailVerificationToken(data) {
        const [token] = await db
            .insert(emailVerificationTokens)
            .values(data)
            .returning();
        return token;
    },
    async findEmailVerificationTokenByHash(tokenHash) {
        const [token] = await db
            .select()
            .from(emailVerificationTokens)
            .where(and(eq(emailVerificationTokens.tokenHash, tokenHash), isNull(emailVerificationTokens.usedAt)))
            .limit(1);
        return token || null;
    },
    async markEmailVerificationTokenUsed(tokenId) {
        await db
            .update(emailVerificationTokens)
            .set({ usedAt: new Date() })
            .where(eq(emailVerificationTokens.id, tokenId));
    },
    async createPasswordResetToken(data) {
        const [token] = await db
            .insert(passwordResetTokens)
            .values(data)
            .returning();
        return token;
    },
    async findPasswordResetTokenByHash(tokenHash) {
        const [token] = await db
            .select()
            .from(passwordResetTokens)
            .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)))
            .limit(1);
        return token || null;
    },
    async markPasswordResetTokenUsed(tokenId) {
        await db
            .update(passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(passwordResetTokens.id, tokenId));
    },
    async findDeviceByUserAndHash(userId, deviceHash) {
        const [row] = await db
            .select()
            .from(userDevices)
            .where(and(eq(userDevices.userId, userId), eq(userDevices.deviceHash, deviceHash)))
            .limit(1);
        return row ?? null;
    },
    async createDevice(data) {
        const [device] = await db.insert(userDevices).values(data).returning();
        return device;
    },
    async updateDeviceLastSeen(deviceId) {
        await db
            .update(userDevices)
            .set({ lastSeenAt: new Date() })
            .where(eq(userDevices.id, deviceId));
    },
    async listUsers(options) {
        const conditions = [];
        if (options?.role)
            conditions.push(eq(users.role, options.role));
        if (options?.identityVerified !== undefined)
            conditions.push(eq(users.identityVerified, options.identityVerified));
        if (options?.businessLicenseStatus)
            conditions.push(eq(users.businessLicenseStatus, options.businessLicenseStatus));
        if (options?.prescriptionAuthorityStatus)
            conditions.push(eq(users.prescriptionAuthorityStatus, options.prescriptionAuthorityStatus));
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
            countryOfPractice: users.countryOfPractice,
            phoneNumber: users.phoneNumber,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        })
            .from(users)
            .orderBy(desc(users.createdAt));
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        return (await query);
    },
    async countUsers(options) {
        const conditions = [];
        if (options?.role)
            conditions.push(eq(users.role, options.role));
        if (options?.identityVerified !== undefined)
            conditions.push(eq(users.identityVerified, options.identityVerified));
        if (options?.businessLicenseStatus)
            conditions.push(eq(users.businessLicenseStatus, options.businessLicenseStatus));
        if (options?.prescriptionAuthorityStatus)
            conditions.push(eq(users.prescriptionAuthorityStatus, options.prescriptionAuthorityStatus));
        let query = db.select({ count: sql `count(*)` }).from(users);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        const [result] = await query;
        return Number(result?.count ?? 0);
    },
    async countPendingVerifications() {
        const [result] = await db
            .select({ count: sql `count(*)` })
            .from(users)
            .where(or(eq(users.businessLicenseStatus, "pending"), eq(users.prescriptionAuthorityStatus, "pending")));
        return Number(result?.count ?? 0);
    }
};
