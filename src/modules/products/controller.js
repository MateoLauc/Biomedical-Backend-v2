import { productsService } from "./service";
export const productsController = {
    // Categories
    async createCategory(req, res) {
        const result = await productsService.createCategory(req.body);
        res.status(201).json(result);
    },
    async getCategory(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        const category = await productsService.getCategory(id);
        res.json(category);
    },
    async listCategories(_req, res) {
        const categories = await productsService.listCategories();
        res.json({ categories });
    },
    async listCategoriesTree(_req, res) {
        const result = await productsService.listCategoriesTree();
        res.json(result);
    },
    async updateCategory(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        const category = await productsService.updateCategory(id, req.body);
        res.json(category);
    },
    async deleteCategory(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        await productsService.deleteCategory(id);
        res.status(204).send();
    },
    // Products
    async createProduct(req, res) {
        const result = await productsService.createProduct(req.body);
        res.status(201).json(result);
    },
    async getProduct(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        const product = await productsService.getProduct(id);
        res.json(product);
    },
    async listProducts(req, res) {
        const options = {};
        if (typeof req.query.categoryId === "string") {
            options.categoryId = req.query.categoryId;
        }
        if (req.query.isActive === "true") {
            options.isActive = true;
        }
        else if (req.query.isActive === "false") {
            options.isActive = false;
        }
        if (req.query.requiresApproval === "true") {
            options.requiresApproval = true;
        }
        else if (req.query.requiresApproval === "false") {
            options.requiresApproval = false;
        }
        if (req.query.page) {
            options.page = parseInt(req.query.page, 10);
        }
        if (req.query.limit) {
            options.limit = parseInt(req.query.limit, 10);
        }
        const result = await productsService.listProducts(options);
        res.json(result);
    },
    async updateProduct(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        const product = await productsService.updateProduct(id, req.body);
        res.json(product);
    },
    async deleteProduct(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        await productsService.deleteProduct(id);
        res.status(204).send();
    },
    // Product Variants
    async createProductVariant(req, res) {
        const result = await productsService.createProductVariant(req.body);
        res.status(201).json(result);
    },
    async updateProductVariant(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        const variant = await productsService.updateProductVariant(id, req.body);
        res.json(variant);
    },
    async deleteProductVariant(req, res) {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        await productsService.deleteProductVariant(id);
        res.status(204).send();
    }
};
