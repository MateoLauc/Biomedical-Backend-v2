import { Router } from "express";
import { shippingController } from "./controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { createShippingAddressSchema, updateShippingAddressSchema } from "./schema";
export const shippingRoutes = Router();
// All shipping routes require authentication
shippingRoutes.use(requireAuth);
shippingRoutes.get("/", (req, res) => shippingController.listShippingAddresses(req, res));
shippingRoutes.get("/:id", (req, res) => shippingController.getShippingAddress(req, res));
shippingRoutes.post("/", validateBody(createShippingAddressSchema), (req, res) => shippingController.createShippingAddress(req, res));
shippingRoutes.patch("/:id", validateBody(updateShippingAddressSchema), (req, res) => shippingController.updateShippingAddress(req, res));
shippingRoutes.delete("/:id", (req, res) => shippingController.deleteShippingAddress(req, res));
