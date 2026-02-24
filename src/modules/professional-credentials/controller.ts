import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { credentialsService } from "./service.js";
import { badRequest } from "../../lib/http-errors.js";
import { uploadImage, uploadRaw, uploadPdf, isCloudinaryConfigured } from "../../lib/cloudinary.js";
import { authRepo } from "../auth/repo.js";

export const credentialsController = {
  async getMy(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to view your submission." });
    }
    const result = await credentialsService.getMySubmission(userId);
    res.json(result ?? { submission: null, documents: [] });
  },

  async saveDraft(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to save a draft." });
    }
    const input = req.body as import("./types.js").SaveDraftInput;
    const result = await credentialsService.saveDraft(userId, input);
    res.json(result);
  },

  async submit(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to submit." });
    }
    const input = req.body as import("./types.js").SubmitInput;
    const user = await authRepo.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }
    const result = await credentialsService.submit(userId, input, user.email, user.firstName);
    res.json(result);
  },

  async uploadSignature(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to upload." });
    }
    if (!isCloudinaryConfigured) {
      throw badRequest("File upload is not configured.");
    }
    const file = req.file;
    if (!file?.buffer) {
      throw badRequest("No file provided. Please upload an image (e.g. PNG) for your signature.");
    }
    const { url } = await uploadImage(file.buffer, { folder: "credentials/signatures" });
    res.json({ url });
  },

  async uploadDocument(req: Request, res: Response) {
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Please sign in to upload." });
    }
    if (!isCloudinaryConfigured) {
      throw badRequest("File upload is not configured.");
    }
    const file = req.file;
    if (!file?.buffer) {
      throw badRequest("No file provided.");
    }
    const rawName = file.originalname?.trim();
    const hasValidExtension = rawName?.includes(".");
    const looksLikeUuid = rawName && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawName.replace(/\.[^.]*$/, ""));
    const fileName =
      rawName && hasValidExtension && !looksLikeUuid
        ? rawName
        : file.mimetype === "application/pdf"
          ? "document.pdf"
          : file.mimetype?.startsWith("image/")
            ? `document.${file.mimetype.replace("image/", "") === "jpeg" ? "jpg" : file.mimetype.replace("image/", "")}`
            : "document";

    const isPdf = file.mimetype === "application/pdf";
    const baseName = rawName ? rawName.replace(/\.[^.]*$/, "").trim() : "";
    const sanitized = baseName.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || undefined;
    const pdfPublicId = isPdf
      ? (sanitized || randomUUID().slice(0, 12))
      : undefined;
    let url: string;
    if (isPdf) {
      try {
        const result = await uploadPdf(file.buffer, { folder: "credentials/documents", publicId: pdfPublicId });
        url = result.url;
      } catch {
        const result = await uploadRaw(file.buffer, { folder: "credentials/documents", publicId: pdfPublicId });
        url = result.url;
      }
    } else {
      const result = await uploadImage(file.buffer, { folder: "credentials/documents" });
      url = result.url;
    }
    res.json({ url, fileName });
  }
};
