import { productsRepo } from "./repo";
import { badRequest, notFound } from "../../lib/http-errors";
import type { Category, CategoryInput, ProductInput, ProductVariantInput, ProductWithVariants } from "./types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const productsService = {
  // Categories
  async createCategory(input: CategoryInput): Promise<{ id: string; name: string; slug: string }> {
    const slug = input.slug || slugify(input.name);
    const existing = await productsRepo.findCategoryBySlug(slug);
    if (existing) {
      throw badRequest("A category with this name already exists.");
    }

    const categoryData: CategoryInput = {
      name: input.name.trim(),
      slug
    };
    if (input.description) {
      categoryData.description = input.description.trim();
    }
    const category = await productsRepo.createCategory(categoryData);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug
    };
  },

  async getCategory(id: string) {
    const category = await productsRepo.findCategoryById(id);
    if (!category) {
      throw notFound("Category not found.");
    }
    return category;
  },

  async listCategories() {
    const categories = await productsRepo.listCategories();
    return { categories };
  },

  async listCategoriesTree() {
    // Get all categories
    const allCategories = await productsRepo.listCategories();
    
    // Build tree structure
    const categoryMap = new Map<string, Category & { subCategories: Category[] }>();
    const rootCategories: (Category & { subCategories: Category[] })[] = [];

    // Initialize all categories with empty subCategories array
    for (const category of allCategories) {
      categoryMap.set(category.id, { ...category, subCategories: [] });
    }

    // Build the tree
    for (const category of allCategories) {
      const categoryWithChildren = categoryMap.get(category.id);
      if (!categoryWithChildren) continue;

      if (category.parentCategoryId) {
        // This is a sub-category, add it to parent's subCategories
        const parent = categoryMap.get(category.parentCategoryId);
        if (parent) {
          parent.subCategories.push(categoryWithChildren);
        }
      } else {
        // This is a root category
        rootCategories.push(categoryWithChildren);
      }
    }

    return { categories: rootCategories };
  },

  async updateCategory(id: string, input: Partial<CategoryInput>) {
    const category = await productsRepo.findCategoryById(id);
    if (!category) {
      throw notFound("Category not found.");
    }

    const updateData: Partial<CategoryInput> = {};
    if (input.name) {
      updateData.name = input.name.trim();
    }
    if (input.description !== undefined) {
      updateData.description = input.description?.trim();
    }
    if (input.slug) {
      const existing = await productsRepo.findCategoryBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw badRequest("A category with this slug already exists.");
      }
      updateData.slug = input.slug;
    }

    return productsRepo.updateCategory(id, updateData);
  },

  async deleteCategory(id: string) {
    const category = await productsRepo.findCategoryById(id);
    if (!category) {
      throw notFound("Category not found.");
    }
    await productsRepo.deleteCategory(id);
  },

  // Products
  async createProduct(input: ProductInput): Promise<{ id: string; name: string; slug: string }> {
    const category = await productsRepo.findCategoryById(input.categoryId);
    if (!category) {
      throw badRequest("Invalid category selected.");
    }

    const slug = input.slug || slugify(input.name);
    const existing = await productsRepo.findProductBySlug(slug);
    if (existing) {
      throw badRequest("A product with this name already exists.");
    }

    const productData: ProductInput = {
      categoryId: input.categoryId,
      name: input.name.trim(),
      slug,
      requiresApproval: input.requiresApproval,
      stockQuantity: input.stockQuantity ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 10
    };
    if (input.description) {
      productData.description = input.description.trim();
    }
    if (input.composition) {
      productData.composition = input.composition.trim();
    }
    if (input.indication) {
      productData.indication = input.indication.trim();
    }
    if (input.imageUrl !== undefined) {
      productData.imageUrl = input.imageUrl && input.imageUrl.trim() ? input.imageUrl.trim() : null;
    }
    const product = await productsRepo.createProduct(productData);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug
    };
  },

  async getProduct(id: string): Promise<ProductWithVariants> {
    const product = await productsRepo.findProductById(id);
    if (!product) {
      throw notFound("Product not found.");
    }

    const category = await productsRepo.findCategoryById(product.categoryId);
    if (!category) {
      throw notFound("Product category not found.");
    }

    const variants = await productsRepo.findProductVariantsByProductId(product.id);

    return {
      ...product,
      category,
      variants
    };
  },

  async listProducts(options?: {
    categoryId?: string;
    isActive?: boolean;
    requiresApproval?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const offset = (page - 1) * limit;

    const listOptions: {
      categoryId?: string;
      isActive?: boolean;
      requiresApproval?: boolean;
      limit?: number;
      offset?: number;
    } = {
      limit,
      offset
    };
    if (options?.categoryId) {
      listOptions.categoryId = options.categoryId;
    }
    if (options?.isActive !== undefined) {
      listOptions.isActive = options.isActive;
    }
    if (options?.requiresApproval !== undefined) {
      listOptions.requiresApproval = options.requiresApproval;
    }

    const countOptions: {
      categoryId?: string;
      isActive?: boolean;
      requiresApproval?: boolean;
    } = {};
    if (options?.categoryId) {
      countOptions.categoryId = options.categoryId;
    }
    if (options?.isActive !== undefined) {
      countOptions.isActive = options.isActive;
    }
    if (options?.requiresApproval !== undefined) {
      countOptions.requiresApproval = options.requiresApproval;
    }

    const [items, total] = await Promise.all([
      productsRepo.listProducts(listOptions),
      productsRepo.countProducts(countOptions)
    ]);

    // Fetch categories and variants for each product
    const productsWithDetails = await Promise.all(
      items.map(async (product) => {
        const category = await productsRepo.findCategoryById(product.categoryId);
        const variants = await productsRepo.findProductVariantsByProductId(product.id);
        return {
          ...product,
          category: category || undefined,
          variants
        };
      })
    );

    return {
      items: productsWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async updateProduct(id: string, input: Partial<ProductInput>) {
    const product = await productsRepo.findProductById(id);
    if (!product) {
      throw notFound("Product not found.");
    }

    const updateData: Partial<ProductInput> = {};
    if (input.categoryId) {
      const category = await productsRepo.findCategoryById(input.categoryId);
      if (!category) {
        throw badRequest("Invalid category selected.");
      }
      updateData.categoryId = input.categoryId;
    }
    if (input.name) {
      updateData.name = input.name.trim();
    }
    if (input.description !== undefined) {
      updateData.description = input.description?.trim();
    }
    if (input.composition !== undefined) {
      updateData.composition = input.composition?.trim();
    }
    if (input.indication !== undefined) {
      updateData.indication = input.indication?.trim();
    }
    if (input.requiresApproval !== undefined) {
      updateData.requiresApproval = input.requiresApproval;
    }
    if (input.stockQuantity !== undefined) {
      updateData.stockQuantity = input.stockQuantity;
    }
    if (input.lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = input.lowStockThreshold;
    }
    if (input.slug) {
      const existing = await productsRepo.findProductBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw badRequest("A product with this slug already exists.");
      }
      updateData.slug = input.slug;
    }
    if (input.imageUrl !== undefined) {
      updateData.imageUrl = input.imageUrl && input.imageUrl.trim() ? input.imageUrl.trim() : null;
    }

    return productsRepo.updateProduct(id, updateData);
  },

  async deleteProduct(id: string) {
    const product = await productsRepo.findProductById(id);
    if (!product) {
      throw notFound("Product not found.");
    }
    await productsRepo.deleteProduct(id);
  },

  // Product Variants
  async createProductVariant(input: ProductVariantInput): Promise<{ id: string; packSize: string; price: string }> {
    const product = await productsRepo.findProductById(input.productId);
    if (!product) {
      throw badRequest("Invalid product selected.");
    }

    const variant = await productsRepo.createProductVariant({
      productId: input.productId,
      packSize: input.packSize.trim(),
      price: input.price,
      stockQuantity: input.stockQuantity ?? 0
    });

    return {
      id: variant.id,
      packSize: variant.packSize,
      price: variant.price
    };
  },

  async updateProductVariant(id: string, input: Partial<ProductVariantInput>) {
    const variant = await productsRepo.findProductVariantById(id);
    if (!variant) {
      throw notFound("Product variant not found.");
    }

    const updateData: Partial<ProductVariantInput> = {};
    if (input.packSize) {
      updateData.packSize = input.packSize.trim();
    }
    if (input.price) {
      updateData.price = input.price;
    }
    if (input.stockQuantity !== undefined) {
      updateData.stockQuantity = input.stockQuantity;
    }

    return productsRepo.updateProductVariant(id, updateData);
  },

  async deleteProductVariant(id: string) {
    const variant = await productsRepo.findProductVariantById(id);
    if (!variant) {
      throw notFound("Product variant not found.");
    }
    await productsRepo.deleteProductVariant(id);
  }
};
