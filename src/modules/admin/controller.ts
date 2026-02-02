import type { Request, Response } from "express";
import { adminService } from "./service";
import type { ListUsersQuery, UpdateUserVerificationInput } from "./types";

export const adminController = {
  async listUsers(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }

    const q = req.query as Record<string, unknown>;
    const query: ListUsersQuery = {};
    if (q.role === "super_admin" || q.role === "admin" || q.role === "customer") query.role = q.role;
    if (q.identityVerified !== undefined && q.identityVerified !== "") {
      query.identityVerified = q.identityVerified === "true" || q.identityVerified === true;
    }
    if (
      q.businessLicenseStatus === "not_submitted" ||
      q.businessLicenseStatus === "pending" ||
      q.businessLicenseStatus === "approved" ||
      q.businessLicenseStatus === "rejected"
    ) {
      query.businessLicenseStatus = q.businessLicenseStatus;
    }
    if (
      q.prescriptionAuthorityStatus === "not_submitted" ||
      q.prescriptionAuthorityStatus === "pending" ||
      q.prescriptionAuthorityStatus === "approved" ||
      q.prescriptionAuthorityStatus === "rejected"
    ) {
      query.prescriptionAuthorityStatus = q.prescriptionAuthorityStatus;
    }
    if (typeof q.page === "number" && q.page >= 1) query.page = q.page;
    if (typeof q.limit === "number" && q.limit >= 1 && q.limit <= 100) query.limit = q.limit;

    const result = await adminService.listUsers(query, userRole);
    res.json(result);
  },

  async getDashboard(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }

    const stats = await adminService.getDashboardStats(userRole);
    res.json(stats);
  },

  async getInventoryOverview(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }

    const overview = await adminService.getInventoryOverview(userRole);
    res.json(overview);
  },

  async updateUserVerification(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }

    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const user = await adminService.updateUserVerification(userRole, id, req.body as UpdateUserVerificationInput);
    res.json({ message: "User verification status updated successfully.", user });
  }
};
