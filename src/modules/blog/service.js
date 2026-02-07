import { blogRepo } from "./repo";
import { notFound, forbidden } from "../../lib/http-errors";
/** Generate URL-safe slug from title (lowercase, hyphens, no special chars). */
function slugify(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "post";
}
/** Ensure slug is unique by appending a short suffix if needed. */
async function ensureUniqueSlug(slug, excludeId) {
    let candidate = slug;
    let n = 0;
    while (true) {
        const existing = await blogRepo.findBySlug(candidate);
        if (!existing || (excludeId && existing.id === excludeId))
            return candidate;
        n += 1;
        candidate = `${slug}-${n}`;
    }
}
export const blogService = {
    async list(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;
        const type = query.type === "press_releases" || query.type === "videos" || query.type === "news_article" ? query.type : undefined;
        const status = query.status === "draft" || query.status === "published" ? query.status : undefined;
        const listOptions = { limit, offset };
        if (type)
            listOptions.type = type;
        if (status)
            listOptions.status = status;
        const countOptions = {};
        if (type)
            countOptions.type = type;
        if (status)
            countOptions.status = status;
        const [posts, total] = await Promise.all([
            blogRepo.list(listOptions),
            blogRepo.count(countOptions)
        ]);
        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1
            }
        };
    },
    async getById(id) {
        const post = await blogRepo.findById(id);
        if (!post)
            throw notFound("Blog post not found.");
        return post;
    },
    async getBySlug(slug) {
        const post = await blogRepo.findBySlug(slug);
        if (!post)
            throw notFound("Blog post not found.");
        return post;
    },
    async create(input, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can create blog posts.");
        }
        const slug = input.slug ? await ensureUniqueSlug(input.slug) : await ensureUniqueSlug(slugify(input.title));
        const status = input.status ?? "draft";
        const createData = {
            title: input.title,
            body: input.body,
            slug,
            status,
            ...(status === "published" && { publishedAt: new Date() })
        };
        if (input.imageUrl && input.imageUrl.length > 0)
            createData.imageUrl = input.imageUrl;
        if (input.type)
            createData.type = input.type;
        const post = await blogRepo.create(createData);
        return post;
    },
    async update(id, input, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can update blog posts.");
        }
        const existing = await blogRepo.findById(id);
        if (!existing)
            throw notFound("Blog post not found.");
        let slug = input.slug;
        if (slug !== undefined) {
            slug = await ensureUniqueSlug(slug, id);
        }
        const updatePayload = {
            ...input,
            ...(slug !== undefined && { slug })
        };
        if (input.imageUrl !== undefined)
            updatePayload.imageUrl = input.imageUrl;
        if (input.status === "published" && !existing.publishedAt) {
            updatePayload.publishedAt = new Date();
        }
        const updated = await blogRepo.update(id, updatePayload);
        if (!updated)
            throw notFound("Blog post not found.");
        return updated;
    },
    async delete(id, userRole) {
        if (userRole !== "super_admin" && userRole !== "admin") {
            throw forbidden("Only administrators can delete blog posts.");
        }
        const deleted = await blogRepo.delete(id);
        if (!deleted)
            throw notFound("Blog post not found.");
    }
};
