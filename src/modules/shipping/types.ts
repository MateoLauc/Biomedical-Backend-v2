import type { shippingAddresses } from "../../db/schema/index.js";

export type ShippingAddress = typeof shippingAddresses.$inferSelect;

export type ShippingAddressInput = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  additionalPhoneNumber?: string;
  deliveryAddress: string;
  additionalInformation?: string;
  region: string;
  message?: string;
  isDefault?: boolean;
};

export type ShippingAddressUpdate = Partial<ShippingAddressInput>;
