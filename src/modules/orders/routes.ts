import { Router, type Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import { ordersController } from "./controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody, validateQuery } from "../../middleware/validation.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { createOrderSchema, updateOrderStatusSchema, updatePaymentStatusSchema, cancelOrderSchema, listOrdersQuerySchema } from "./schema.js";

const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const imageOk = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);
    const pdfOk = file.mimetype === "application/pdf";
    if (imageOk || pdfOk) {
      cb(null, true);
    } else {
      cb(new Error("Only images (JPEG, PNG, GIF, WebP) or PDF are allowed."));
    }
  }
});

export const ordersRoutes = Router();

ordersRoutes.use(requireAuth);

ordersRoutes.post(
  "/",
  paymentProofUpload.single("document"),
  validateBody(createOrderSchema),
  asyncHandler((req, res) => ordersController.createOrder(req, res))
);
ordersRoutes.get("/", validateQuery(listOrdersQuerySchema), asyncHandler((req, res) => ordersController.listOrders(req, res)));
ordersRoutes.get("/:id", asyncHandler((req, res) => ordersController.getOrder(req, res)));
ordersRoutes.patch("/:id/status", requireRole("super_admin", "admin"), validateBody(updateOrderStatusSchema), asyncHandler((req, res) =>
  ordersController.updateOrderStatus(req, res)
));
ordersRoutes.post("/:id/cancel", validateBody(cancelOrderSchema), asyncHandler((req, res) => ordersController.cancelOrder(req, res)));
ordersRoutes.post(
  "/:id/payment-proof",
  paymentProofUpload.single("document"),
  asyncHandler((req, res) => ordersController.uploadPaymentProof(req, res))
);
ordersRoutes.patch(
  "/:id/payment-status",
  requireRole("super_admin", "admin"),
  validateBody(updatePaymentStatusSchema),
  asyncHandler((req, res) => ordersController.updatePaymentStatus(req, res))
);
