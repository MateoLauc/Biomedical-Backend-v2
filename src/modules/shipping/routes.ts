import { Router } from "express";
import { shippingController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { asyncHandler } from "../../middleware/async-handler";
import { createShippingAddressSchema, updateShippingAddressSchema } from "./schema";

export const shippingRoutes = Router();

// All shipping routes require authentication
shippingRoutes.use(requireAuth);

shippingRoutes.get("/", asyncHandler((req, res) => shippingController.listShippingAddresses(req, res)));
shippingRoutes.get("/:id", asyncHandler((req, res) => shippingController.getShippingAddress(req, res)));
shippingRoutes.post("/", validateBody(createShippingAddressSchema), asyncHandler((req, res) => shippingController.createShippingAddress(req, res)));
shippingRoutes.patch("/:id", validateBody(updateShippingAddressSchema), asyncHandler((req, res) => shippingController.updateShippingAddress(req, res)));
shippingRoutes.delete("/:id", asyncHandler((req, res) => shippingController.deleteShippingAddress(req, res)));
