import type { PublicUser } from "../auth/types";

/** Current user profile (includes whoYouAre, countryOfPractice, phoneNumber for profile page). */
export interface ProfileUser extends PublicUser {
  whoYouAre: string;
  countryOfPractice: string;
  phoneNumber: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  whoYouAre?: string;
  phoneNumber?: string;
  countryOfPractice?: string;
  email?: string;
}
