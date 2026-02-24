import type { Request, Response } from "express";
import { adminService } from "./service.js";
import { credentialsService } from "../professional-credentials/service.js";
import type { ListUsersQuery, UpdateUserVerificationInput } from "./types.js";
import { env } from "../../config/env.js";
import { badRequest } from "../../lib/http-errors.js";

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
    // When status=rejected, filter for users with both credentials rejected
    if (q.status === "rejected") {
      query.businessLicenseStatus = "rejected";
      query.prescriptionAuthorityStatus = "rejected";
    } else if (q.status === "verified") {
      query.businessLicenseStatus = "approved";
      query.prescriptionAuthorityStatus = "approved";
    } else if (q.status === "pending") {
      query.status = "pending";
    } else {
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
  },

  async getCredentialsSubmission(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }
    const userId = typeof req.params.id === "string" ? req.params.id : "";
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    const result = await credentialsService.getSubmissionByUserId(userId);
    if (!result) {
      return res.status(404).json({ message: "No credentials submission found for this user." });
    }
    res.json(result);
  },

  async createAdmin(req: Request, res: Response) {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }

    const data = req.body as { firstName: string; lastName: string; email: string; password: string; role: string; phoneNumber: string; stateOfPractice: string };
    const actorUserId = req.user?.userId;
    const ip = req.ip;
    const userAgent = req.get("user-agent") || undefined;
    const admin = await adminService.createAdmin(userRole, data, actorUserId, ip, userAgent);
    res.status(201).json({ message: "Admin user created.", admin });
  },

  /** Stream a credentials document (e.g. PDF) from Cloudinary with correct filename. Avoids CORS and forces inline display. */
  async documentProxy(req: Request, res: Response) {
    if (!req.user?.role) {
      return res.status(401).json({ error: "Please sign in to access this resource." });
    }
    const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
    const filename = typeof req.query.filename === "string" && req.query.filename.trim()
      ? req.query.filename.trim()
      : "document.pdf";

    if (!rawUrl) {
      throw badRequest("Query parameter 'url' is required.");
    }
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw badRequest("Invalid URL.");
    }
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const allowedOrigin = cloudName
      ? `https://res.cloudinary.com/${cloudName}/`
      : "";
    if (!allowedOrigin || !parsed.href.startsWith(allowedOrigin)) {
      throw badRequest("URL is not allowed.");
    }

    const upstream = await fetch(parsed.href, { method: "GET" });
    if (!upstream.ok) {
      return res.status(upstream.status).send(upstream.statusText);
    }
    const contentType = upstream.headers.get("Content-Type") || "application/pdf";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename.replace(/"/g, "%22")}"`);
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  }
};
