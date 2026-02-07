export function canPurchaseProduct(user, requirements) {
    if (!user.identityVerified) {
        return {
            allowed: false,
            reason: "Identity verification required. Please verify your email address."
        };
    }
    if (requirements.requiresBusinessLicense) {
        if (user.businessLicenseStatus !== "approved") {
            return {
                allowed: false,
                reason: "Business license verification required and approved"
            };
        }
    }
    if (requirements.requiresPrescriptionAuthority) {
        if (user.prescriptionAuthorityStatus !== "approved") {
            return {
                allowed: false,
                reason: "Prescription authority verification required and approved"
            };
        }
    }
    return { allowed: true };
}
