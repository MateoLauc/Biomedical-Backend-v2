import { eq, and, desc, sql, asc, gt, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, products, productVariants } from "../../db/schema/index.js";
import type { Category, Product, ProductVariant, CategoryInput, ProductInput, ProductVariantInput } from "./types.js";

export const productsRepo = {
  // Categories
  async createCategory(data: CategoryInput): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category as Category;
  },

  async findCategoryById(id: string): Promise<Category | null> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return (category as Category) || null;
  },

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return (category as Category) || null;
  },

  async listCategories(): Promise<Category[]> {
    return (await db.select().from(categories).orderBy(asc(categories.name))) as Category[];
  },

  async findSubCategoriesByParentId(parentId: string): Promise<Category[]> {
    const subCategories = await db.select().from(categories).where(eq(categories.parentCategoryId, parentId)).orderBy(asc(categories.name));
    return subCategories as Category[];
  },

  async updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category as Category;
  },

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  },

  // Products
  async createProduct(data: ProductInput): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product as Product;
  },

  async findProductById(id: string): Promise<Product | null> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return (product as Product) || null;
  },

  async findProductBySlug(slug: string): Promise<Product | null> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return (product as Product) || null;
  },

  async listProducts(options?: {
    categoryId?: string;
    isActive?: boolean;
    requiresApproval?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const conditions = [];
    if (options?.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }
    if (options?.isActive !== undefined) {
      conditions.push(eq(products.isActive, options.isActive));
    }
    if (options?.requiresApproval !== undefined) {
      conditions.push(eq(products.requiresApproval, options.requiresApproval));
    }

    let query = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    query = query.orderBy(desc(products.createdAt)) as typeof query;

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    return (await query) as Product[];
  },

  async countProducts(options?: {
    categoryId?: string;
    isActive?: boolean;
    requiresApproval?: boolean;
  }): Promise<number> {
    const conditions = [];
    if (options?.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }
    if (options?.isActive !== undefined) {
      conditions.push(eq(products.isActive, options.isActive));
    }
    if (options?.requiresApproval !== undefined) {
      conditions.push(eq(products.requiresApproval, options.requiresApproval));
    }

    let query = db.select({ count: sql<number>`count(*)` }).from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const [result] = await query;
    return Number(result?.count || 0);
  },

  async getInventoryCounts(): Promise<{ total: number; available: number; outOfStock: number; lowStock: number }> {
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [outOfStockResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.stockQuantity, 0));
    const [lowStockResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(gt(products.stockQuantity, 0), lte(products.stockQuantity, products.lowStockThreshold)));
    const total = Number(totalResult?.count ?? 0);
    const outOfStock = Number(outOfStockResult?.count ?? 0);
    const lowStock = Number(lowStockResult?.count ?? 0);
    const available = total - outOfStock;
    return { total, available, outOfStock, lowStock };
  },

  async updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product as Product;
  },

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  },

  // Product Variants
  async createProductVariant(data: ProductVariantInput): Promise<ProductVariant> {
    const [variant] = await db.insert(productVariants).values(data).returning();
    return variant as ProductVariant;
  },

  async findProductVariantById(id: string): Promise<ProductVariant | null> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id)).limit(1);
    return (variant as ProductVariant) || null;
  },

  async findProductVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    return (await db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)))
      .orderBy(productVariants.packSize)) as ProductVariant[];
  },

  async updateProductVariant(id: string, data: Partial<ProductVariantInput>): Promise<ProductVariant> {
    const [variant] = await db
      .update(productVariants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return variant as ProductVariant;
  },

  async deleteProductVariant(id: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }
};
