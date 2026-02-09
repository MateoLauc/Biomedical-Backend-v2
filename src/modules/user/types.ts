import type { PublicUser } from "../auth/types.js";

/** Current user profile (includes whoYouAre, stateOfPractice, phoneNumber for profile page). */
export interface ProfileUser extends PublicUser {
  whoYouAre: string;
  stateOfPractice: string;
  phoneNumber: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  whoYouAre?: string;
  phoneNumber?: string;
  stateOfPractice?: string;
  email?: string;
}
