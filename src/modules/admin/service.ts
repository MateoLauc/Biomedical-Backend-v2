import { authRepo } from "../auth/repo";
import { productsRepo } from "../products/repo";
import { ordersRepo } from "../orders/repo";
import { forbidden } from "../../lib/http-errors";
import type { AdminUserListItem, DashboardStats, InventoryOverview, ListUsersQuery } from "./types";

export const adminService = {
  async listUsers(query: ListUsersQuery, userRole: string): Promise<{
    users: AdminUserListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can list users.");
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const filters: Parameters<typeof authRepo.listUsers>[0] = { limit, offset };
    if (query.role) filters.role = query.role as "super_admin" | "admin" | "customer";
    if (query.identityVerified !== undefined) {
      filters.identityVerified = query.identityVerified === "true" || query.identityVerified === true;
    }
    if (query.businessLicenseStatus) filters.businessLicenseStatus = query.businessLicenseStatus as "not_submitted" | "pending" | "approved" | "rejected";
    if (query.prescriptionAuthorityStatus) filters.prescriptionAuthorityStatus = query.prescriptionAuthorityStatus as "not_submitted" | "pending" | "approved" | "rejected";

    const countFilters: Parameters<typeof authRepo.countUsers>[0] = {};
    if (query.role) countFilters.role = query.role as "super_admin" | "admin" | "customer";
    if (query.identityVerified !== undefined) {
      countFilters.identityVerified = query.identityVerified === "true" || query.identityVerified === true;
    }
    if (query.businessLicenseStatus) countFilters.businessLicenseStatus = query.businessLicenseStatus as "not_submitted" | "pending" | "approved" | "rejected";
    if (query.prescriptionAuthorityStatus) countFilters.prescriptionAuthorityStatus = query.prescriptionAuthorityStatus as "not_submitted" | "pending" | "approved" | "rejected";

    const [users, total] = await Promise.all([authRepo.listUsers(filters), authRepo.countUsers(countFilters)]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  async getDashboardStats(userRole: string): Promise<DashboardStats> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can view the dashboard.");
    }

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenue,
      pendingVerifications,
      inventoryCounts,
      ordersPending,
      ordersProcessing,
      ordersShipped,
      ordersDelivered,
      ordersCancelled
    ] = await Promise.all([
      authRepo.countUsers(),
      productsRepo.countProducts(),
      ordersRepo.countOrders(),
      ordersRepo.getRevenueTotal(),
      authRepo.countPendingVerifications(),
      productsRepo.getInventoryCounts(),
      ordersRepo.countOrders({ status: "pending" }),
      ordersRepo.countOrders({ status: "processing" }),
      ordersRepo.countOrders({ status: "shipped" }),
      ordersRepo.countOrders({ status: "delivered" }),
      ordersRepo.countOrders({ status: "cancelled" })
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      revenue,
      pendingVerifications,
      lowStockCount: inventoryCounts.lowStock,
      ordersByStatus: {
        pending: ordersPending,
        processing: ordersProcessing,
        shipped: ordersShipped,
        delivered: ordersDelivered,
        cancelled: ordersCancelled
      }
    };
  },

  async getInventoryOverview(userRole: string): Promise<InventoryOverview> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can view inventory overview.");
    }

    return productsRepo.getInventoryCounts();
  }
};
