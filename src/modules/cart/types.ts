import type { cartItems, productVariants, products } from "../../db/schema/index.js";

export type CartItem = typeof cartItems.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Product = typeof products.$inferSelect;

export type CartItemInput = {
  productVariantId: string;
  quantity: number;
};

export type CartItemUpdate = {
  quantity: number;
};

export type CartItemWithDetails = {
  id: string;
  userId: string;
  productVariantId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  productVariant: {
    id: string;
    productId: string;
    packSize: string;
    price: string;
    stockQuantity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    product: {
      id: string;
      categoryId: string;
      name: string;
      slug: string;
      description: string | null;
      composition: string | null;
      indication: string | null;
      requiresApproval: boolean;
      isActive: boolean;
      stockQuantity: number;
      lowStockThreshold: number;
      createdAt: Date;
      updatedAt: Date;
    };
  };
};
