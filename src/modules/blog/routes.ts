import { Router, type Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import { blogController } from "./controller";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/async-handler";
import { createBlogPostSchema, updateBlogPostSchema, listBlogPostsQuerySchema } from "./schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, GIF, WebP) are allowed."));
    }
  }
});

export const blogRoutes = Router();

// Public: list and get by id or slug
blogRoutes.get("/posts", validateQuery(listBlogPostsQuerySchema), asyncHandler((req, res) => blogController.list(req, res)));
blogRoutes.get("/posts/slug/:slug", asyncHandler((req, res) => blogController.getBySlug(req, res)));
blogRoutes.get("/posts/:id", asyncHandler((req, res) => blogController.getById(req, res)));

// Admin only: create, update, delete, upload image
blogRoutes.post(
  "/posts",
  requireAuth,
  requireRole("super_admin", "admin"),
  validateBody(createBlogPostSchema),
  asyncHandler((req, res) => blogController.create(req, res))
);
blogRoutes.patch(
  "/posts/:id",
  requireAuth,
  requireRole("super_admin", "admin"),
  validateBody(updateBlogPostSchema),
  asyncHandler((req, res) => blogController.update(req, res))
);
blogRoutes.delete("/posts/:id", requireAuth, requireRole("super_admin", "admin"), asyncHandler((req, res) =>
  blogController.delete(req, res)
));

blogRoutes.post(
  "/upload-image",
  requireAuth,
  requireRole("super_admin", "admin"),
  upload.single("image"),
  asyncHandler((req, res) => blogController.uploadImage(req, res))
);
