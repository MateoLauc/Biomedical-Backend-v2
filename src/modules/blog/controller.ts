import type { Request, Response } from "express";
import { blogService } from "./service.js";
import { uploadImage, isCloudinaryConfigured } from "../../lib/cloudinary.js";
import type { CreateBlogPostInput, UpdateBlogPostInput, ListBlogPostsQuery } from "./types.js";

export const blogController = {
  async list(req: Request, res: Response) {
    const q = req.query as Record<string, unknown>;
    const query: ListBlogPostsQuery = {};
    if (q.type === "press_releases" || q.type === "videos" || q.type === "news_article") query.type = q.type;
    if (q.status === "draft" || q.status === "published") query.status = q.status;
    if (typeof q.page === "number" && q.page >= 1) query.page = q.page;
    if (typeof q.limit === "number" && q.limit >= 1 && q.limit <= 100) query.limit = q.limit;

    const result = await blogService.list(query);
    res.json(result);
  },

  async getById(req: Request, res: Response) {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Blog post ID is required." });
    }
    const post = await blogService.getById(id);
    res.json({ post });
  },

  async getBySlug(req: Request, res: Response) {
    const slug = typeof req.params.slug === "string" ? req.params.slug : "";
    if (!slug) {
      return res.status(400).json({ error: "Slug is required." });
    }
    const post = await blogService.getBySlug(slug);
    res.json({ post });
  },

  async create(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to create blog posts." });
    }
    const post = await blogService.create(req.body as CreateBlogPostInput, userRole);
    res.status(201).json({ message: "Blog post created successfully.", post });
  },

  async update(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to update blog posts." });
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Blog post ID is required." });
    }
    const post = await blogService.update(id, req.body as UpdateBlogPostInput, userRole);
    res.json({ message: "Blog post updated successfully.", post });
  },

  async delete(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to delete blog posts." });
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Blog post ID is required." });
    }
    await blogService.delete(id, userRole);
    res.json({ message: "Blog post deleted successfully." });
  },

  async uploadImage(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to upload images." });
    }
    if (userRole !== "super_admin" && userRole !== "admin") {
      return res.status(403).json({ error: "Only administrators can upload blog images." });
    }
    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        error: "Image upload is not available. Cloudinary is not configured."
      });
    }
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: "No image file provided. Use multipart/form-data with field 'image'." });
    }
    const { url } = await uploadImage(file.buffer, { folder: "blog" });
    res.status(201).json({ message: "Image uploaded successfully.", url });
  }
};
