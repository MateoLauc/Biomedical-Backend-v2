import { z } from "zod";
const blogPostStatusSchema = z.enum(["draft", "published"]);
const blogPostTypeSchema = z.enum(["press_releases", "videos", "news_article"]);
export const createBlogPostSchema = z.object({
    title: z.string().min(1, "Title is required.").max(500),
    slug: z.string().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.").optional(),
    body: z.string().min(1, "Body is required."),
    imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
    type: blogPostTypeSchema.optional(),
    status: blogPostStatusSchema.optional()
});
export const updateBlogPostSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    slug: z.string().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only.").optional(),
    body: z.string().min(1).optional(),
    imageUrl: z.union([z.string().url(), z.literal("")]).optional(),
    type: blogPostTypeSchema.optional(),
    status: blogPostStatusSchema.optional()
});
export const listBlogPostsQuerySchema = z.object({
    type: z
        .string()
        .refine((val) => !val || blogPostTypeSchema.safeParse(val).success, { message: "Invalid type. Must be press_releases, videos, or news_article." })
        .optional(),
    status: z
        .string()
        .refine((val) => !val || blogPostStatusSchema.safeParse(val).success, { message: "Invalid status. Must be draft or published." })
        .optional(),
    page: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(1, "Page must be 1 or greater."))
        .optional(),
    limit: z
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().int().min(1).max(100, "Limit must be between 1 and 100."))
        .optional()
});
