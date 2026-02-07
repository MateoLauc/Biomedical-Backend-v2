import { careersService } from "./service";
export const careersController = {
    async list(req, res) {
        const q = req.query;
        const query = {};
        if (q.status === "open" || q.status === "closed")
            query.status = q.status;
        if (typeof q.page === "number" && q.page >= 1)
            query.page = q.page;
        if (typeof q.limit === "number" && q.limit >= 1 && q.limit <= 100)
            query.limit = q.limit;
        const result = await careersService.list(query);
        res.json(result);
    },
    async getById(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        if (!id) {
            return res.status(400).json({ error: "Job ID is required." });
        }
        const job = await careersService.getById(id);
        res.json({ job });
    },
    async create(req, res) {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({ error: "Please sign in to create job postings." });
        }
        const job = await careersService.create(req.body, userRole);
        res.status(201).json({ message: "Job posting created successfully.", job });
    },
    async update(req, res) {
        const userRole = req.user?.role;
        if (!userRole) {
            return res.status(401).json({ error: "Please sign in to update job postings." });
        }
        const id = typeof req.params.id === "string" ? req.params.id : "";
        if (!id) {
            return res.status(400).json({ error: "Job ID is required." });
        }
        const job = await careersService.update(id, req.body, userRole);
        res.json({ message: "Job posting updated successfully.", job });
    },
    async delete(req, res) {
        const userRole = req.user?.role;
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
