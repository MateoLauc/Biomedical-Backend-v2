import type { users, refreshTokens, emailVerificationTokens, passwordResetTokens } from "../../db/schema/index.js";

export type User = typeof users.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export interface SignupInput {
  firstName: string;
  lastName: string;
  whoYouAre: string;
  email: string;
  phoneNumber: string;
  password: string;
  stateOfPractice: string;
}

export interface SigninInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Returned by refreshAccessToken; includes role so the controller can set user_role cookie. */
export interface RefreshResult extends AuthTokens {
  role: PublicUser["role"];
}

export interface PublicUser {
  id: string;
  role: "super_admin" | "admin" | "customer";
  firstName: string;
  lastName: string;
  email: string;
  emailVerifiedAt: Date | null;
  identityVerified: boolean;
  businessLicenseStatus: "not_submitted" | "pending" | "approved" | "rejected";
  prescriptionAuthorityStatus: "not_submitted" | "pending" | "approved" | "rejected";
}
