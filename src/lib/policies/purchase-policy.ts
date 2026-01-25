import type { PublicUser } from "../../modules/auth/types";

export interface ProductPurchaseRequirements {
  requiresBusinessLicense?: boolean;
  requiresPrescriptionAuthority?: boolean;
}

export interface PurchasePolicyResult {
  allowed: boolean;
  reason?: string;
}

export function canPurchaseProduct(
  user: PublicUser,
  requirements: ProductPurchaseRequirements
): PurchasePolicyResult {
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
