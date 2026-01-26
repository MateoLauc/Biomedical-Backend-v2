import { cartRepo } from "./repo";
import { productVariants } from "../../db/schema";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import { badRequest, notFound } from "../../lib/http-errors";
import type { CartItemInput, CartItemUpdate, CartItemWithDetails } from "./types";

export const cartService = {
  async getCart(userId: string): Promise<{ items: CartItemWithDetails[]; totalItems: number }> {
    const items: CartItemWithDetails[] = await cartRepo.getCartItemsWithDetails(userId);
    const totalItems: number = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, totalItems };
  },

  async addToCart(userId: string, input: CartItemInput): Promise<{ id: string; productVariantId: string; quantity: number }> {
    // Verify product variant exists and is active
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.id, input.productVariantId), eq(productVariants.isActive, true)))
      .limit(1);

    if (!variant) {
      throw notFound("Product variant not found or is no longer available.");
    }

    // Check if item already exists in cart
    const existingItem = await cartRepo.findCartItemByUserAndVariant(userId, input.productVariantId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + input.quantity;
      if (newQuantity > 100) {
        throw badRequest("Total quantity cannot exceed 100. Please update the existing item instead.");
      }

      const updated = await cartRepo.updateCartItem(existingItem.id, userId, { quantity: newQuantity });
      return {
        id: updated.id,
        productVariantId: updated.productVariantId,
        quantity: updated.quantity
      };
    }

    // Create new cart item
    const item = await cartRepo.createCartItem(userId, input);
    return {
      id: item.id,
      productVariantId: item.productVariantId,
      quantity: item.quantity
    };
  },

  async updateCartItem(userId: string, itemId: string, input: CartItemUpdate): Promise<{ id: string; quantity: number }> {
    const item = await cartRepo.findCartItemById(itemId, userId);
    if (!item) {
      throw notFound("Cart item not found.");
    }

    const updated = await cartRepo.updateCartItem(itemId, userId, input);
    return {
      id: updated.id,
      quantity: updated.quantity
    };
  },

  async removeFromCart(userId: string, itemId: string): Promise<void> {
    const item = await cartRepo.findCartItemById(itemId, userId);
    if (!item) {
      throw notFound("Cart item not found.");
    }

    await cartRepo.deleteCartItem(itemId, userId);
  },

  async clearCart(userId: string): Promise<void> {
    await cartRepo.clearCart(userId);
  }
};
