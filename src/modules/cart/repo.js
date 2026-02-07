import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { cartItems, productVariants, products } from "../../db/schema";
export const cartRepo = {
    async findCartItemByUserAndVariant(userId, productVariantId) {
        const [item] = await db
            .select()
            .from(cartItems)
            .where(and(eq(cartItems.userId, userId), eq(cartItems.productVariantId, productVariantId)))
            .limit(1);
        return item || null;
    },
    async findCartItemById(id, userId) {
        const [item] = await db
            .select()
            .from(cartItems)
            .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
            .limit(1);
        return item || null;
    },
    async getCartItemsWithDetails(userId) {
        const items = await db
            .select({
            // Cart item fields
            id: cartItems.id,
            userId: cartItems.userId,
            productVariantId: cartItems.productVariantId,
            quantity: cartItems.quantity,
            createdAt: cartItems.createdAt,
            updatedAt: cartItems.updatedAt,
            // Product variant fields
            variantId: productVariants.id,
            variantProductId: productVariants.productId,
            variantPackSize: productVariants.packSize,
            variantPrice: productVariants.price,
            variantStockQuantity: productVariants.stockQuantity,
            variantIsActive: productVariants.isActive,
            variantCreatedAt: productVariants.createdAt,
            variantUpdatedAt: productVariants.updatedAt,
            // Product fields
            productId: products.id,
            productCategoryId: products.categoryId,
            productName: products.name,
            productSlug: products.slug,
            productDescription: products.description,
            productComposition: products.composition,
            productIndication: products.indication,
            productRequiresApproval: products.requiresApproval,
            productIsActive: products.isActive,
            productStockQuantity: products.stockQuantity,
            productLowStockThreshold: products.lowStockThreshold,
            productCreatedAt: products.createdAt,
            productUpdatedAt: products.updatedAt
        })
            .from(cartItems)
            .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
            .innerJoin(products, eq(productVariants.productId, products.id))
            .where(eq(cartItems.userId, userId))
            .orderBy(desc(cartItems.createdAt));
        const mappedItems = items.map((item) => ({
            id: item.id,
            userId: item.userId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            productVariant: {
                id: item.variantId,
                productId: item.variantProductId,
                packSize: item.variantPackSize,
                price: item.variantPrice,
                stockQuantity: item.variantStockQuantity,
                isActive: item.variantIsActive,
                createdAt: item.variantCreatedAt,
                updatedAt: item.variantUpdatedAt,
                product: {
                    id: item.productId,
                    categoryId: item.productCategoryId,
                    name: item.productName,
                    slug: item.productSlug,
                    description: item.productDescription,
                    composition: item.productComposition,
                    indication: item.productIndication,
                    requiresApproval: item.productRequiresApproval,
                    isActive: item.productIsActive,
                    stockQuantity: item.productStockQuantity,
                    lowStockThreshold: item.productLowStockThreshold,
                    createdAt: item.productCreatedAt,
                    updatedAt: item.productUpdatedAt
                }
            }
        }));
        return mappedItems;
    },
    async createCartItem(userId, data) {
        const [item] = await db
            .insert(cartItems)
            .values({
            userId,
            productVariantId: data.productVariantId,
            quantity: data.quantity
        })
            .returning();
        return item;
    },
    async updateCartItem(id, userId, data) {
        const [item] = await db
            .update(cartItems)
            .set({
            quantity: data.quantity,
            updatedAt: new Date()
        })
            .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
            .returning();
        return item;
    },
    async deleteCartItem(id, userId) {
        await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
    },
    async clearCart(userId) {
        await db.delete(cartItems).where(eq(cartItems.userId, userId));
    },
    async countCartItems(userId) {
        const result = await db
            .select({ count: cartItems.id })
            .from(cartItems)
            .where(eq(cartItems.userId, userId));
        return result.length;
    }
};
