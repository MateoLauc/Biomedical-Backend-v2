import { authRepo } from "../auth/repo";
import { productsRepo } from "../products/repo";
import { ordersRepo } from "../orders/repo";
import { forbidden, notFound } from "../../lib/http-errors";
export const adminService = {
    async listUsers(query, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can list users.");
        }
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;
        const filters = { limit, offset };
        if (query.role)
            filters.role = query.role;
        if (query.identityVerified !== undefined) {
            filters.identityVerified = query.identityVerified === "true" || query.identityVerified === true;
        }
        if (query.businessLicenseStatus)
            filters.businessLicenseStatus = query.businessLicenseStatus;
        if (query.prescriptionAuthorityStatus)
            filters.prescriptionAuthorityStatus = query.prescriptionAuthorityStatus;
        const countFilters = {};
        if (query.role)
            countFilters.role = query.role;
        if (query.identityVerified !== undefined) {
            countFilters.identityVerified = query.identityVerified === "true" || query.identityVerified === true;
        }
        if (query.businessLicenseStatus)
            countFilters.businessLicenseStatus = query.businessLicenseStatus;
        if (query.prescriptionAuthorityStatus)
            countFilters.prescriptionAuthorityStatus = query.prescriptionAuthorityStatus;
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
    async getDashboardStats(userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can view the dashboard.");
        }
        const [totalUsers, totalProducts, totalOrders, revenue, pendingVerifications, inventoryCounts, ordersPending, ordersProcessing, ordersShipped, ordersDelivered, ordersCancelled] = await Promise.all([
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
    async getInventoryOverview(userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can view inventory overview.");
        }
        return productsRepo.getInventoryCounts();
    },
    async updateUserVerification(userRole, targetUserId, input) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can update user verification status.");
        }
        const existing = await authRepo.findUserById(targetUserId);
        if (!existing) {
            throw notFound("User not found.");
        }
        const data = {};
        if (input.businessLicenseStatus !== undefined)
            data.businessLicenseStatus = input.businessLicenseStatus;
        if (input.prescriptionAuthorityStatus !== undefined)
            data.prescriptionAuthorityStatus = input.prescriptionAuthorityStatus;
        await authRepo.updateUserVerification(targetUserId, data);
        const updated = await authRepo.findUserById(targetUserId);
        if (!updated) {
            throw notFound("User not found.");
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
            countryOfPractice: updated.countryOfPractice,
            phoneNumber: updated.phoneNumber,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt
        };
    }
};
