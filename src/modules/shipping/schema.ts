import { z } from "zod";

const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

export const createShippingAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required.").max(100, "First name cannot exceed 100 characters."),
  lastName: z.string().min(1, "Last name is required.").max(100, "Last name cannot exceed 100 characters."),
  phoneNumber: z.string().regex(phoneRegex, "Please enter a valid phone number."),
  additionalPhoneNumber: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  deliveryAddress: z.string().min(5, "Delivery address must be at least 5 characters.").max(500, "Delivery address cannot exceed 500 characters."),
  additionalInformation: z.string().max(500, "Additional information cannot exceed 500 characters.").optional().or(z.literal("")),
  region: z.string().min(1, "Region is required.").max(100, "Region cannot exceed 100 characters."),
  message: z.string().max(1000, "Message cannot exceed 1000 characters.").optional().or(z.literal("")),
  isDefault: z.boolean().optional()
});

export const updateShippingAddressSchema = createShippingAddressSchema.partial();
