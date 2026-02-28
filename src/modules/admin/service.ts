import { authRepo } from "../auth/repo.js";
import { productsRepo } from "../products/repo.js";
import { ordersRepo } from "../orders/repo.js";
import { badRequest, forbidden, notFound } from "../../lib/http-errors.js";
import type { AdminUserListItem, DashboardStats, InventoryOverview, ListUsersQuery, UpdateUserVerificationInput } from "./types.js";
import { hashPassword } from "../../lib/auth/password.js";
import { sendAdminWelcomeEmail, sendCredentialsApprovedEmail, sendCredentialsDeclinedEmail } from "../../lib/email/index.js";
import { auditRepo } from "../audit/repo.js";

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
    if (query.status === "pending") {
      filters.credentialStatus = "pending";
    } else {
      if (query.businessLicenseStatus) filters.businessLicenseStatus = query.businessLicenseStatus as "not_submitted" | "pending" | "approved" | "rejected";
      if (query.prescriptionAuthorityStatus) filters.prescriptionAuthorityStatus = query.prescriptionAuthorityStatus as "not_submitted" | "pending" | "approved" | "rejected";
    }

    const countFilters: Parameters<typeof authRepo.countUsers>[0] = {};
    if (query.role) countFilters.role = query.role as "super_admin" | "admin" | "customer";
    if (query.identityVerified !== undefined) {
      countFilters.identityVerified = query.identityVerified === "true" || query.identityVerified === true;
    }
    if (query.status === "pending") {
      countFilters.credentialStatus = "pending";
    } else {
      if (query.businessLicenseStatus) countFilters.businessLicenseStatus = query.businessLicenseStatus as "not_submitted" | "pending" | "approved" | "rejected";
      if (query.prescriptionAuthorityStatus) countFilters.prescriptionAuthorityStatus = query.prescriptionAuthorityStatus as "not_submitted" | "pending" | "approved" | "rejected";
    }

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
      rejectedUsersCount,
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
      authRepo.countRejectedUsers(),
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
      rejectedUsersCount,
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
  },

  async updateUserVerification(
    userRole: string,
    targetUserId: string,
    input: UpdateUserVerificationInput
  ): Promise<AdminUserListItem> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can update user verification status.");
    }

    const existing = await authRepo.findUserById(targetUserId);
    if (!existing) {
      throw notFound("User not found.");
    }

    const data: Parameters<typeof authRepo.updateUserVerification>[1] = {};
    if (input.businessLicenseStatus !== undefined) data.businessLicenseStatus = input.businessLicenseStatus;
    if (input.prescriptionAuthorityStatus !== undefined) data.prescriptionAuthorityStatus = input.prescriptionAuthorityStatus;

    await authRepo.updateUserVerification(targetUserId, data);
    const updated = await authRepo.findUserById(targetUserId);
    if (!updated) {
      throw notFound("User not found.");
    }

    if (
      updated.businessLicenseStatus === "approved" &&
      updated.prescriptionAuthorityStatus === "approved"
    ) {
      try {
        await sendCredentialsApprovedEmail(updated.email, updated.firstName ?? "Customer");
      } catch (err) {
        console.error("Failed to send credentials approved email to", updated.email, err);
      }
    } else if (
      updated.businessLicenseStatus === "rejected" &&
      updated.prescriptionAuthorityStatus === "rejected"
    ) {
      try {
        await sendCredentialsDeclinedEmail(updated.email, updated.firstName ?? "Customer");
      } catch (err) {
        console.error("Failed to send credentials declined email to", updated.email, err);
      }
    }

    return {
      id: updated.id,
      role: updated.role,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      emailVerifiedAt: updated.emailVerifiedAt,
      identityVerified: updated.identityVerified,
      businessLicenseStatus: updated.businessLicenseStatus,
      prescriptionAuthorityStatus: updated.prescriptionAuthorityStatus,
      whoYouAre: updated.whoYouAre,
      stateOfPractice: updated.stateOfPractice,
      phoneNumber: updated.phoneNumber,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  },
  async createAdmin(userRole: string, data: { firstName: string; lastName: string; email: string; password: string; role: string; phoneNumber?: string; stateOfPractice?: string }, actorUserId?: string, ip?: string, userAgent?: string) {
    if (userRole !== "super_admin") {
      throw forbidden("Only super administrators can create admin accounts.");
    }

    const emailLower = data.email.toLowerCase().trim();
    const existing = await authRepo.findUserByEmail(emailLower);
    if (existing) {
      throw badRequest("This email address is already registered. Please use a different email.");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await authRepo.createUser({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      whoYouAre: "Admin",
      email: data.email.trim(),
      emailLower,
      phoneNumber: data.phoneNumber ?? "",
      stateOfPractice: data.stateOfPractice ?? "",
      passwordHash,
      role: data.role === "super_admin" ? "super_admin" : "admin"
    });

    // send welcome email with temporary password info
    try {
      await sendAdminWelcomeEmail(user.email, user.firstName, data.password);
    } catch (err) {
      // log but don't fail creation
      console.error("Failed to send admin welcome email", err);
    }

    // audit log
    try {
      await auditRepo.createLog({
        actorUserId: actorUserId ?? null,
        action: "create_admin",
        entityType: "user",
        entityId: user.id,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        metadata: { email: user.email, role: user.role }
      });
    } catch (err) {
      console.error("Failed to write audit log for createAdmin", err);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
  }
};
