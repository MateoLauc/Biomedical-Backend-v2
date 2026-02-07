import { eq, and, desc, sql, asc, gt, lte } from "drizzle-orm";
import { db } from "../../db";
import { categories, products, productVariants } from "../../db/schema";
export const productsRepo = {
    // Categories
    async createCategory(data) {
        const [category] = await db.insert(categories).values(data).returning();
        return category;
    },
    async findCategoryById(id) {
        const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
        return category || null;
    },
    async findCategoryBySlug(slug) {
        const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
        return category || null;
    },
    async listCategories() {
        return (await db.select().from(categories).orderBy(asc(categories.name)));
    },
    async findSubCategoriesByParentId(parentId) {
        const subCategories = await db.select().from(categories).where(eq(categories.parentCategoryId, parentId)).orderBy(asc(categories.name));
        return subCategories;
    },
    async updateCategory(id, data) {
        const [category] = await db
            .update(categories)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(categories.id, id))
            .returning();
        return category;
    },
    async deleteCategory(id) {
        await db.delete(categories).where(eq(categories.id, id));
    },
    // Products
    async createProduct(data) {
        const [product] = await db.insert(products).values(data).returning();
        return product;
    },
    async findProductById(id) {
        const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        return product || null;
    },
    async findProductBySlug(slug) {
        const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
        return product || null;
    },
    async listProducts(options) {
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
            query = query.where(and(...conditions));
        }
        query = query.orderBy(desc(products.createdAt));
        if (options?.limit) {
            query = query.limit(options.limit);
        }
        if (options?.offset) {
            query = query.offset(options.offset);
        }
        return (await query);
    },
    async countProducts(options) {
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
        let query = db.select({ count: sql `count(*)` }).from(products);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        const [result] = await query;
        return Number(result?.count || 0);
    },
    async getInventoryCounts() {
        const [totalResult] = await db.select({ count: sql `count(*)` }).from(products);
        const [outOfStockResult] = await db
            .select({ count: sql `count(*)` })
            .from(products)
            .where(eq(products.stockQuantity, 0));
        const [lowStockResult] = await db
            .select({ count: sql `count(*)` })
            .from(products)
            .where(and(gt(products.stockQuantity, 0), lte(products.stockQuantity, products.lowStockThreshold)));
        const total = Number(totalResult?.count ?? 0);
        const outOfStock = Number(outOfStockResult?.count ?? 0);
        const lowStock = Number(lowStockResult?.count ?? 0);
        const available = total - outOfStock;
        return { total, available, outOfStock, lowStock };
    },
    async updateProduct(id, data) {
        const [product] = await db
            .update(products)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(products.id, id))
            .returning();
        return product;
    },
    async deleteProduct(id) {
        await db.delete(products).where(eq(products.id, id));
    },
    // Product Variants
    async createProductVariant(data) {
        const [variant] = await db.insert(productVariants).values(data).returning();
        return variant;
    },
    async findProductVariantById(id) {
        const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id)).limit(1);
        return variant || null;
    },
    async findProductVariantsByProductId(productId) {
        return (await db
            .select()
            .from(productVariants)
            .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)))
            .orderBy(productVariants.packSize));
    },
    async updateProductVariant(id, data) {
        const [variant] = await db
            .update(productVariants)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(productVariants.id, id))
            .returning();
        return variant;
    },
    async deleteProductVariant(id) {
        await db.delete(productVariants).where(eq(productVariants.id, id));
    }
};
