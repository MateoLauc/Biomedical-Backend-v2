import type { AdminUserListItem } from "../auth/repo.js";

export type { AdminUserListItem };

export type DashboardStats = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  pendingVerifications: number;
  rejectedUsersCount: number;
  lowStockCount: number;
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
};

export type InventoryOverview = {
  total: number;
  available: number;
  outOfStock: number;
  lowStock: number;
};

export type ListUsersQuery = {
  role?: "super_admin" | "admin" | "customer";
  identityVerified?: boolean | string;
  status?: "verified" | "pending" | "rejected";
  businessLicenseStatus?: "not_submitted" | "pending" | "approved" | "rejected";
  prescriptionAuthorityStatus?: "not_submitted" | "pending" | "approved" | "rejected";
  page?: number;
  limit?: number;
};

export type UpdateUserVerificationInput = {
  businessLicenseStatus?: "not_submitted" | "pending" | "approved" | "rejected";
  prescriptionAuthorityStatus?: "not_submitted" | "pending" | "approved" | "rejected";
};
