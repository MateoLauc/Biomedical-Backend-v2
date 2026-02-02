import { Router } from "express";
import { productsController } from "./controller";
import { validateBody } from "../../middleware/validation";
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createProductVariantSchema,
  updateProductVariantSchema
} from "./schema";
import { requireAuth, requireRole } from "../../middleware/auth";

const productsRoutes = Router();

// Categories (Admin only)
productsRoutes.post("/categories", requireAuth, requireRole("super_admin", "admin"), validateBody(createCategorySchema), (req, res) =>
  productsController.createCategory(req, res)
);
productsRoutes.get("/categories", (req, res) => productsController.listCategories(req, res));
productsRoutes.get("/categories/tree", (req, res) => productsController.listCategoriesTree(req, res));
productsRoutes.get("/categories/:id", (req, res) => productsController.getCategory(req, res));
productsRoutes.patch("/categories/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateCategorySchema), (req, res) =>
  productsController.updateCategory(req, res)
);
productsRoutes.delete("/categories/:id", requireAuth, requireRole("super_admin", "admin"), (req, res) =>
  productsController.deleteCategory(req, res)
);

// Products
productsRoutes.post("/", requireAuth, requireRole("super_admin", "admin"), validateBody(createProductSchema), (req, res) =>
  productsController.createProduct(req, res)
);
productsRoutes.get("/", (req, res) => productsController.listProducts(req, res));
productsRoutes.get("/:id", (req, res) => productsController.getProduct(req, res));
productsRoutes.patch("/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateProductSchema), (req, res) =>
  productsController.updateProduct(req, res)
);
productsRoutes.delete("/:id", requireAuth, requireRole("super_admin", "admin"), (req, res) =>
  productsController.deleteProduct(req, res)
);

// Product Variants
productsRoutes.post("/variants", requireAuth, requireRole("super_admin", "admin"), validateBody(createProductVariantSchema), (req, res) =>
  productsController.createProductVariant(req, res)
);
productsRoutes.patch("/variants/:id", requireAuth, requireRole("super_admin", "admin"), validateBody(updateProductVariantSchema), (req, res) =>
  productsController.updateProductVariant(req, res)
);
productsRoutes.delete("/variants/:id", requireAuth, requireRole("super_admin", "admin"), (req, res) =>
  productsController.deleteProductVariant(req, res)
);

export { productsRoutes };
