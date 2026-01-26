import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db";
import { cartItems, productVariants, products } from "../../db/schema";
import type { CartItem, CartItemInput, CartItemUpdate, CartItemWithDetails } from "./types";

export const cartRepo = {
  async findCartItemByUserAndVariant(userId: string, productVariantId: string): Promise<CartItem | null> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productVariantId, productVariantId)))
      .limit(1);
    return (item as CartItem) || null;
  },

  async findCartItemById(id: string, userId: string): Promise<CartItem | null> {
    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .limit(1);
    return (item as CartItem) || null;
  },

  async getCartItemsWithDetails(userId: string): Promise<CartItemWithDetails[]> {
    const items = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        productVariant: productVariants,
        product: products
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));

    return items.map((item) => ({
      id: item.id,
      userId: item.userId,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      productVariant: {
        ...item.productVariant,
        product: item.product
      }
    })) as CartItemWithDetails[];
  },

  async createCartItem(userId: string, data: CartItemInput): Promise<CartItem> {
    const [item] = await db
      .insert(cartItems)
      .values({
        userId,
        productVariantId: data.productVariantId,
        quantity: data.quantity
      })
      .returning();
    return item as CartItem;
  },

  async updateCartItem(id: string, userId: string, data: CartItemUpdate): Promise<CartItem> {
    const [item] = await db
      .update(cartItems)
      .set({
        quantity: data.quantity,
        updatedAt: new Date()
      })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return item as CartItem;
  },

  async deleteCartItem(id: string, userId: string): Promise<void> {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  },

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  },

  async countCartItems(userId: string): Promise<number> {
    const result = await db
      .select({ count: cartItems.id })
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    return result.length;
  }
};
