import { Router, type Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import { credentialsController } from "./controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validation.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { saveDraftSchema, submitSchema } from "./schema.js";

const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed."));
  }
};

const signatureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const imageOk = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    const pdfOk = file.mimetype === "application/pdf";
    if (imageOk || pdfOk) {
      cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, PNG, GIF, WebP) or PDF are allowed."));
    }
  }
});

export const credentialsRoutes = Router();

credentialsRoutes.get(
  "/me",
  requireAuth,
  requireRole("customer"),
  asyncHandler((req, res) => credentialsController.getMy(req, res))
);

credentialsRoutes.post(
  "/draft",
  requireAuth,
  requireRole("customer"),
  validateBody(saveDraftSchema),
  asyncHandler((req, res) => credentialsController.saveDraft(req, res))
);

credentialsRoutes.post(
  "/submit",
  requireAuth,
  requireRole("customer"),
  validateBody(submitSchema),
  asyncHandler((req, res) => credentialsController.submit(req, res))
);

credentialsRoutes.post(
  "/upload-signature",
  requireAuth,
  requireRole("customer"),
  signatureUpload.single("signature"),
  asyncHandler((req, res) => credentialsController.uploadSignature(req, res))
);

credentialsRoutes.post(
  "/upload-document",
  requireAuth,
  requireRole("customer"),
  documentUpload.single("document"),
  asyncHandler((req, res) => credentialsController.uploadDocument(req, res))
);
