import { authRepo } from "../auth/repo";
import { badRequest, notFound } from "../../lib/http-errors";
function toProfileUser(user) {
    return {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        identityVerified: user.identityVerified,
        businessLicenseStatus: user.businessLicenseStatus,
        prescriptionAuthorityStatus: user.prescriptionAuthorityStatus,
        whoYouAre: user.whoYouAre,
        countryOfPractice: user.countryOfPractice,
        phoneNumber: user.phoneNumber
    };
}
export const userService = {
    async getMe(userId) {
        const user = await authRepo.findUserById(userId);
        if (!user) {
            throw notFound("User not found.");
        }
        return toProfileUser(user);
    },
    async updateProfile(userId, input) {
        const user = await authRepo.findUserById(userId);
        if (!user) {
            throw notFound("User not found.");
        }
        const data = {};
        if (input.firstName !== undefined)
            data.firstName = input.firstName.trim();
        if (input.lastName !== undefined)
            data.lastName = input.lastName.trim();
        if (input.whoYouAre !== undefined)
            data.whoYouAre = input.whoYouAre.trim();
        if (input.countryOfPractice !== undefined)
            data.countryOfPractice = input.countryOfPractice.trim();
        if (input.phoneNumber !== undefined) {
            const phoneNumber = input.phoneNumber.trim();
            const existingByPhone = await authRepo.findUserByPhoneNumber(phoneNumber);
            if (existingByPhone && existingByPhone.id !== userId) {
                throw badRequest("This phone number is already in use. Please use a different phone number.");
            }
            data.phoneNumber = phoneNumber;
        }
        if (input.email !== undefined) {
            const email = input.email.trim();
            const emailLower = email.toLowerCase();
            const existingByEmail = await authRepo.findUserByEmail(emailLower);
            if (existingByEmail && existingByEmail.id !== userId) {
                throw badRequest("This email address is already in use. Please use a different email.");
            }
            data.email = email;
            data.emailLower = emailLower;
            data.emailVerifiedAt = null;
        }
        const updated = await authRepo.updateProfile(userId, data);
        return toProfileUser(updated);
    }
};
