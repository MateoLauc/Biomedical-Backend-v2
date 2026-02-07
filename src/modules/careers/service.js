import { careersRepo } from "./repo";
import { notFound, forbidden } from "../../lib/http-errors";
export const careersService = {
    async list(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;
        const status = query.status === "open" || query.status === "closed" ? query.status : undefined;
        const listOptions = { limit, offset };
        if (status)
            listOptions.status = status;
        const countOptions = {};
        if (status)
            countOptions.status = status;
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
    async getById(id) {
        const job = await careersRepo.findById(id);
        if (!job) {
            throw notFound("Job posting not found.");
        }
        return job;
    },
    async create(input, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can create job postings.");
        }
        return careersRepo.create(input);
    },
    async update(id, input, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can update job postings.");
        }
        const job = await careersRepo.update(id, input);
        if (!job) {
            throw notFound("Job posting not found.");
        }
        return job;
    },
    async delete(id, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can delete job postings.");
        }
        const deleted = await careersRepo.delete(id);
        if (!deleted) {
            throw notFound("Job posting not found.");
        }
    }
};
