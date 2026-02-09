import { Router } from "express";
import { productsController } from "./controller.js";
import { validateBody } from "../../middleware/validation.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createProductVariantSchema,
  updateProductVariantSchema
} from "./schema.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const productsRoutes = Router();

// Categories (Admin only)
productsRoutes.post("/categories", requireAuth, requireRole("super_admin", "admin"), validateBody(createCategorySchema), asyncHandler((req, res) =>
  productsController.createCategory(req, res)
));
productsRoutes.get("/categories", asyncHandler((req, res) => productsController.listCategories(req, res)));
productsRoutes.get("/categories/tree", asyncHandler((req, res) => productsController.listCategoriesTree(req, res)));
productsRoutes.get("/categories/:id", asyncHandler((req, res) => productsController.getCategory(req, res)));
productsRoutes.patch("/categories/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateCategorySchema), asyncHandler((req, res) =>
  productsController.updateCategory(req, res)
));
productsRoutes.delete("/categories/:id", requireAuth, requireRole("super_admin", "admin"), asyncHandler((req, res) =>
  productsController.deleteCategory(req, res)
));

// Products
productsRoutes.post("/", requireAuth, requireRole("super_admin", "admin"), validateBody(createProductSchema), asyncHandler((req, res) =>
  productsController.createProduct(req, res)
));
productsRoutes.get("/", asyncHandler((req, res) => productsController.listProducts(req, res)));
productsRoutes.get("/:id", asyncHandler((req, res) => productsController.getProduct(req, res)));
productsRoutes.patch("/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateProductSchema), asyncHandler((req, res) =>
  productsController.updateProduct(req, res)
));
productsRoutes.delete("/:id", requireAuth, requireRole("super_admin", "admin"), asyncHandler((req, res) =>
  productsController.deleteProduct(req, res)
));

// Product Variants
productsRoutes.post("/variants", requireAuth, requireRole("super_admin", "admin"), validateBody(createProductVariantSchema), asyncHandler((req, res) =>
  productsController.createProductVariant(req, res)
));
productsRoutes.patch("/variants/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateProductVariantSchema), asyncHandler((req, res) =>
  productsController.updateProductVariant(req, res)
));
productsRoutes.delete("/variants/:id", requireAuth, requireRole("super_admin", "admin"), asyncHandler((req, res) =>
  productsController.deleteProductVariant(req, res)
));

export { productsRoutes };
