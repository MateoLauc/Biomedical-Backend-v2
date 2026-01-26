import type { cartItems, productVariants, products } from "../../db/schema";

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

export type CartItemWithDetails = CartItem & {
  productVariant: ProductVariant & {
    product: Product;
  };
};
