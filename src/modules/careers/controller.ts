import type { Request, Response } from "express";
import { careersService } from "./service";
import type { CreateJobInput, UpdateJobInput, ListJobsQuery } from "./types";

export const careersController = {
  async list(req: Request, res: Response) {
    const q = req.query as Record<string, unknown>;
    const query: ListJobsQuery = {};
    if (q.status === "open" || q.status === "closed") query.status = q.status;
    if (typeof q.page === "number" && q.page >= 1) query.page = q.page;
    if (typeof q.limit === "number" && q.limit >= 1 && q.limit <= 100) query.limit = q.limit;

    const result = await careersService.list(query);
    res.json(result);
  },

  async getById(req: Request, res: Response) {
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Job ID is required." });
    }
    const job = await careersService.getById(id);
    res.json({ job });
  },

  async create(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to create job postings." });
    }
    const job = await careersService.create(req.body as CreateJobInput, userRole);
    res.status(201).json({ message: "Job posting created successfully.", job });
  },

  async update(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to update job postings." });
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Job ID is required." });
    }
    const job = await careersService.update(id, req.body as UpdateJobInput, userRole);
    res.json({ message: "Job posting updated successfully.", job });
  },

  async delete(req: Request, res: Response) {
    const userRole = (req as Request & { user?: { role: string } }).user?.role;
    if (!userRole) {
      return res.status(401).json({ error: "Please sign in to delete job postings." });
    }
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!id) {
      return res.status(400).json({ error: "Job ID is required." });
    }
    await careersService.delete(id, userRole);
    res.json({ message: "Job posting deleted successfully." });
  }
};
