import type { categories, products, productVariants } from "../../db/schema";

export type Category = typeof categories.$inferSelect;
export type CategoryWithSubCategories = Category & { subCategories: Category[] };
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string;
};

export type ProductInput = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  composition?: string;
  indication?: string;
  requiresApproval: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
};

export type ProductVariantInput = {
  productId: string;
  packSize: string;
  price: string; // decimal as string
  stockQuantity?: number;
};

export type ProductWithVariants = Product & {
  category: Category;
  variants: ProductVariant[];
};
