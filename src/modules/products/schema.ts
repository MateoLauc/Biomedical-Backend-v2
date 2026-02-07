import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required.").max(200, "Category name must be no more than 200 characters."),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(1000, "Description must be no more than 1000 characters.").optional()
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required.").max(200, "Category name must be no more than 200 characters.").optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(1000, "Description must be no more than 1000 characters.").optional()
});

export const createProductSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID."),
  name: z.string().min(1, "Product name is required.").max(200, "Product name must be no more than 200 characters."),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000, "Description must be no more than 5000 characters.").optional(),
  composition: z.string().max(5000, "Composition must be no more than 5000 characters.").optional(),
  indication: z.string().max(5000, "Indication must be no more than 5000 characters.").optional(),
  imageUrl: z
    .union([
      z.string().url("Invalid image URL.").max(2000, "Image URL must be no more than 2000 characters."),
      z.literal("")
    ])
    .optional(),
  requiresApproval: z.boolean(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be 0 or greater.").optional(),
  lowStockThreshold: z.number().int().min(0, "Low stock threshold must be 0 or greater.").optional()
});

export const updateProductSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID.").optional(),
  name: z.string().min(1, "Product name is required.").max(200, "Product name must be no more than 200 characters.").optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000, "Description must be no more than 5000 characters.").optional(),
  composition: z.string().max(5000, "Composition must be no more than 5000 characters.").optional(),
  indication: z.string().max(5000, "Indication must be no more than 5000 characters.").optional(),
  imageUrl: z
    .union([
      z.string().url("Invalid image URL.").max(2000, "Image URL must be no more than 2000 characters."),
      z.literal("")
    ])
    .optional(),
  requiresApproval: z.boolean().optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be 0 or greater.").optional(),
  lowStockThreshold: z.number().int().min(0, "Low stock threshold must be 0 or greater.").optional()
});

export const createProductVariantSchema = z.object({
  productId: z.string().uuid("Invalid product ID."),
  packSize: z.string().min(1, "Pack size is required.").max(100, "Pack size must be no more than 100 characters."),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal number with up to 2 decimal places."),
  stockQuantity: z.number().int().min(0, "Stock quantity must be 0 or greater.").optional()
});

export const updateProductVariantSchema = z.object({
  packSize: z.string().min(1, "Pack size is required.").max(100, "Pack size must be no more than 100 characters.").optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid decimal number with up to 2 decimal places.").optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity must be 0 or greater.").optional()
});

export const listProductsQuerySchema = z.object({
  categoryId: z.string().uuid("Invalid category ID.").optional(),
  subCategoryId: z.string().uuid("Invalid sub-category ID.").optional(), // Alias for categoryId to make it clearer
  isActive: z.string().transform((val) => val === "true").optional(),
  requiresApproval: z.string().transform((val) => val === "true").optional(),
  page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1, "Page must be 1 or greater.")).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1).max(100, "Limit must be between 1 and 100.")).optional()
});
