import { careersRepo } from "./repo";
import { notFound, forbidden } from "../../lib/http-errors";
import type { Job, CreateJobInput, UpdateJobInput, ListJobsQuery, JobStatus } from "./types";

export const careersService = {
  async list(query: ListJobsQuery): Promise<{
    jobs: Job[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const status = query.status === "open" || query.status === "closed" ? query.status : undefined;

    const listOptions: { status?: JobStatus; limit: number; offset: number } = { limit, offset };
    if (status) listOptions.status = status;
    const countOptions: { status?: JobStatus } = {};
    if (status) countOptions.status = status;

    const [jobsList, total] = await Promise.all([
      careersRepo.list(listOptions),
      careersRepo.count(countOptions)
    ]);

    return {
      jobs: jobsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  },

  async getById(id: string): Promise<Job> {
    const job = await careersRepo.findById(id);
    if (!job) {
      throw notFound("Job posting not found.");
    }
    return job;
  },

  async create(input: CreateJobInput, userRole: string): Promise<Job> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can create job postings.");
    }
    return careersRepo.create(input);
  },

  async update(id: string, input: UpdateJobInput, userRole: string): Promise<Job> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can update job postings.");
    }
    const job = await careersRepo.update(id, input);
    if (!job) {
      throw notFound("Job posting not found.");
    }
    return job;
  },

  async delete(id: string, userRole: string): Promise<void> {
    if (userRole !== "super_admin" && userRole !== "admin") {
      throw forbidden("Only administrators can delete job postings.");
    }
    const deleted = await careersRepo.delete(id);
    if (!deleted) {
      throw notFound("Job posting not found.");
    }
  }
};
