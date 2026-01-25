import type { Request, Response } from "express";
import { productsService } from "./service";
import type { CategoryInput, ProductInput, ProductVariantInput } from "./types";

export const productsController = {
  // Categories
  async createCategory(req: Request, res: Response) {
    const result = await productsService.createCategory(req.body as CategoryInput);
    res.status(201).json(result);
  },

  async getCategory(req: Request, res: Response) {
    const { id } = req.params;
    const category = await productsService.getCategory(id);
    res.json(category);
  },

  async listCategories(_req: Request, res: Response) {
    const categories = await productsService.listCategories();
    res.json({ categories });
  },

  async updateCategory(req: Request, res: Response) {
    const { id } = req.params;
    const category = await productsService.updateCategory(id, req.body as Partial<CategoryInput>);
    res.json(category);
  },

  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params;
    await productsService.deleteCategory(id);
    res.status(204).send();
  },

  // Products
  async createProduct(req: Request, res: Response) {
    const result = await productsService.createProduct(req.body as ProductInput);
    res.status(201).json(result);
  },

  async getProduct(req: Request, res: Response) {
    const { id } = req.params;
    const product = await productsService.getProduct(id);
    res.json(product);
  },

  async listProducts(req: Request, res: Response) {
    const result = await productsService.listProducts({
      categoryId: req.query.categoryId as string | undefined,
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      requiresApproval: req.query.requiresApproval === "true" ? true : req.query.requiresApproval === "false" ? false : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    });
    res.json(result);
  },

  async updateProduct(req: Request, res: Response) {
    const { id } = req.params;
    const product = await productsService.updateProduct(id, req.body as Partial<ProductInput>);
    res.json(product);
  },

  async deleteProduct(req: Request, res: Response) {
    const { id } = req.params;
    await productsService.deleteProduct(id);
    res.status(204).send();
  },

  // Product Variants
  async createProductVariant(req: Request, res: Response) {
    const result = await productsService.createProductVariant(req.body as ProductVariantInput);
    res.status(201).json(result);
  },

  async updateProductVariant(req: Request, res: Response) {
    const { id } = req.params;
    const variant = await productsService.updateProductVariant(id, req.body as Partial<ProductVariantInput>);
    res.json(variant);
  },

  async deleteProductVariant(req: Request, res: Response) {
    const { id } = req.params;
    await productsService.deleteProductVariant(id);
    res.status(204).send();
  }
};
