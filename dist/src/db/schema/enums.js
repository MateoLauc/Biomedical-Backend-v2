import { pgEnum } from "drizzle-orm/pg-core";
export const roleEnum = pgEnum("role", ["super_admin", "admin", "customer"]);
export const verificationStatusEnum = pgEnum("verification_status", [
    "not_submitted",
    "pending",
    "approved",
    "rejected"
]);
