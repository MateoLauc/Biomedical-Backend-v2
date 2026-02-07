import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { roleEnum, verificationStatusEnum } from "./enums";
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    role: roleEnum("role").notNull().default("customer"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    whoYouAre: text("who_you_are").notNull(),
    email: text("email").notNull(),
    emailLower: text("email_lower").notNull(),
    phoneNumber: text("phone_number").notNull(),
    countryOfPractice: text("country_of_practice").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    identityVerified: boolean("identity_verified").notNull().default(false),
    businessLicenseStatus: verificationStatusEnum("business_license_status")
        .notNull()
        .default("not_submitted"),
    prescriptionAuthorityStatus: verificationStatusEnum("prescription_authority_status")
        .notNull()
        .default("not_submitted"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (t) => ({
    emailLowerUq: uniqueIndex("users_email_lower_uq").on(t.emailLower),
    phoneUq: uniqueIndex("users_phone_uq").on(t.phoneNumber),
    roleIdx: index("users_role_idx").on(t.role)
}));
