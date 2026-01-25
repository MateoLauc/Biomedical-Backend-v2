#!/usr/bin/env tsx
/**
 * Product Seeding Script
 * 
 * Parses product.md and seeds the database with categories, products, and variants.
 * 
 * Usage:
 *   npm run db:seed
 * 
 * Note: Prices are set to placeholder values (0.00) since they're not in the markdown file.
 * You'll need to update prices manually or add them to the markdown file later.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "../src/db/index.js";
import { categories, products, productVariants } from "../src/db/schema/index.js";
import { sql } from "drizzle-orm";

interface ParsedProduct {
  name: string;
  description?: string;
  composition?: string;
  indication?: string;
  packSizes: string[];
}

interface ParsedCategory {
  name: string;
  description?: string;
  products: ParsedProduct[];
}

/**
 * Slugify a string for use in URLs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Parse the product.md file and extract categories and products
 */
function parseProductMarkdown(content: string): ParsedCategory[] {
  const categories: ParsedCategory[] = [];
  const lines = content.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  // Known category patterns from the file
  const categoryPatterns = [
    /^INTRAVENOUS\s+FLUIDS?/i,
    /^SYRUPS?\s*&\s*SUSPENSIONS?/i,
    /^COUGH\s*&\s*COLD/i,
    /^ANTI\s+INFECTIVES?/i,
    /^VITAMIN\s*&\s*SUPPLEMENT/i,
    /^ANALGESICS?\s*&\s*ANTIPYRETICS?/i,
    /^ANTACIDS?/i,
    /^ANTIALLERGIES?/i,
    /^BRONCHODIALATOR/i,
    /^BLOOD\s+TONICS?/i,
    /^HOUSE\s+HOLD\s+HYGIENE/i,
    /^PERSONAL\s+CARE\s*&\s*HYGIENE/i,
    /^FAST\s+SELLING\s+CONSUMER\s+GOODS/i,
    /^DIAPER/i,
    /^PERITONEAL\s+DIALYSIS\s+FLUIDS?/i,
    /^CAPD/i
  ];

  let currentCategory: ParsedCategory | null = null;
  let currentProduct: ParsedProduct | null = null;
  let currentSection: "description" | "composition" | "indication" | "packSize" | null = null;
  let categoryDescriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const nextLine = i < lines.length - 1 ? lines[i + 1] ?? "" : "";

    // Skip header lines
    if (line.match(/^(product section layout|PRODUCTS|GENERAL OVERVIEW)$/i)) {
      continue;
    }

    // Check if this is a category header
    const isCategoryHeader = categoryPatterns.some((pattern) => pattern.test(line)) ||
      (line === line.toUpperCase() && line.length > 5 && line.length < 50 && !line.match(/\d/));

    if (isCategoryHeader) {
      // Save previous category
      if (currentCategory) {
        if (currentProduct) {
          currentCategory.products.push(currentProduct);
          currentProduct = null;
        }
        if (currentCategory.products.length > 0) {
          categories.push(currentCategory);
        }
      }

      // Start new category
      currentCategory = {
        name: line,
        products: []
      };
      categoryDescriptionLines = [];
      currentProduct = null;
      currentSection = null;
      continue;
    }

    // Collect category description (lines before first product)
    if (currentCategory && !currentProduct) {
      if (line.length > 20 && !line.match(/^(Description|Composition|Indication|Pack size|Benefits)/i) && !line.match(/^[A-Z][a-z]+\s+[A-Z]/)) {
        categoryDescriptionLines.push(line);
      }
      // If we hit what looks like a product name, set the description
      if (line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*(\s+(IV|Syrup|Solution|Tonic|Diaper|Sanitizer|Wash))?$/)) {
        if (categoryDescriptionLines.length > 0) {
          currentCategory.description = categoryDescriptionLines.join(" ").substring(0, 500);
        }
      }
    }

    // Detect product names - must start with brand names or be clearly product names
    // Product names typically start with: Bioflex, Biomedical, Biogyl, Bioferex, Bioper, Excoff, Ipec, CAPD
    // They should NOT be indication lines (which are usually lowercase or start with verbs)
    const isProductName =
      line.match(/^(Bioflex|Biomedical|Biogyl|Bioferex|Bioper|Excoff|Ipec|CAPD)\s+/i) ||
      (line.length > 5 &&
        line.length < 80 &&
        line.match(/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*(\s+(IV|Syrup|Solution|Tonic|Diaper|Sanitizer|Wash|Cough|Blood|Hand|Baby))?$/i) &&
        !line.match(/^(Description|Composition|Indication|Pack size|Pack Size|Benefits|per|Per|Pack sizes|Pack sizes|Correction|Rehydration|Source|Maintenance|Mild|Severe|Treatment|Management|Support|Fluid|Energy|Hypoglycemia|Hyperkalemia|Nutritional|Removal|Clearance|Patients|Continuous|Ambulatory|Prophylaxis|Systemic|Cryptococcal|Urinary|Respiratory|Anaerobic|Amoebiasis|Hypovolemia|Shock|Blood loss|Suitable|Surgery|Trauma)/i) &&
        !line.match(/^\d+%/) &&
        !line.match(/^\d+\s*(mls|ml|g|kg)/) &&
        !line.match(/^[a-z]/) && // Must start with capital
        !line.match(/^(and|for|with|when|that|which|who|where|during|in|on|at|to|of|the|a|an)\s/i)); // Not starting with common words

    if (isProductName && currentCategory) {
      // Save previous product
      if (currentProduct) {
        currentCategory.products.push(currentProduct);
      }

      // Start new product
      currentProduct = {
        name: line,
        packSizes: []
      };
      currentSection = null;
      continue;
    }

    // Detect section headers
    if (line.match(/^Description/i)) {
      currentSection = "description";
      continue;
    }
    if (line.match(/^Composition/i)) {
      currentSection = "composition";
      continue;
    }
    if (line.match(/^Indication/i)) {
      currentSection = "indication";
      continue;
    }
    if (line.match(/^Pack\s+size/i)) {
      currentSection = "packSize";
      continue;
    }

    // Collect content based on current section
    if (currentProduct) {
      if (currentSection === "description" && line && !line.match(/^(Composition|Indication|Pack size|Benefits)/i)) {
        if (!currentProduct.description) {
          currentProduct.description = line;
        } else if (line.length > 10) {
          currentProduct.description += " " + line;
        }
      } else if (currentSection === "composition" && line && !line.match(/^(Indication|Pack size|per|Per|Pack sizes)/i)) {
        if (!currentProduct.composition) {
          currentProduct.composition = line;
        } else if (!line.match(/^per\s+\d+/i)) {
          currentProduct.composition += " " + line;
        }
      } else if (currentSection === "indication" && line && !line.match(/^(Pack size|Composition|Description)/i)) {
        if (!currentProduct.indication) {
          currentProduct.indication = line;
        } else if (line.length > 5) {
          currentProduct.indication += " " + line;
        }
      } else if (currentSection === "packSize") {
        // Pack sizes - can be comma-separated or on separate lines
        if (line.match(/\d+\s*(mls|ml|pcs|pieces|kg|g)/i)) {
          // Split by comma if present
          const sizes = line.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
          for (const size of sizes) {
            if (size.match(/\d+\s*(mls|ml|pcs|pieces|kg|g)/i)) {
              currentProduct.packSizes.push(size);
            }
          }
        }
      }
    }
  }

  // Don't forget the last product and category
  if (currentCategory) {
    if (currentProduct) {
      currentCategory.products.push(currentProduct);
    }
    if (currentCategory.products.length > 0) {
      categories.push(currentCategory);
    }
  }

  return categories;
}

/**
 * Seed the database with products
 */
async function seedProducts() {
  console.log("🌱 Starting product seeding...\n");

  try {
    // Read the product.md file
    const productMdPath = join(process.cwd(), "product.md");
    console.log(`📖 Reading ${productMdPath}...`);
    const content = readFileSync(productMdPath, "utf-8");

    // Parse the markdown
    console.log("🔍 Parsing product data...");
    const parsedCategories = parseProductMarkdown(content);

    console.log(`\n📊 Found ${parsedCategories.length} categories with ${parsedCategories.reduce((sum, cat) => sum + cat.products.length, 0)} products\n`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing product data...");
    await db.delete(productVariants);
    await db.delete(products);
    await db.delete(categories);
    console.log("✅ Cleared existing data\n");

    // Seed categories and products
    const categoryMap = new Map<string, string>(); // category name -> category id

    for (const catData of parsedCategories) {
      // Create category
      const categorySlug = slugify(catData.name);
      console.log(`📁 Creating category: ${catData.name} (${categorySlug})`);

      const [category] = await db
        .insert(categories)
        .values({
          name: catData.name,
          slug: categorySlug,
          description: catData.description || undefined
        })
        .returning();

      if (!category) {
        console.log(`  ⚠️  Failed to create category: ${catData.name}`);
        continue;
      }

      categoryMap.set(catData.name, category.id);

      // Create products for this category
      for (const productData of catData.products) {
        if (!productData.name || productData.packSizes.length === 0) {
          console.log(`  ⚠️  Skipping product "${productData.name}" - missing name or pack sizes`);
          continue;
        }

        let productSlug = slugify(productData.name);
        let slugSuffix = 1;
        let finalSlug = productSlug;

        // Check for duplicate slugs and append suffix if needed
        while (true) {
          const existing = await db
            .select()
            .from(products)
            .where(sql`slug = ${finalSlug}`)
            .limit(1);
          
          if (existing.length === 0) {
            break; // Slug is unique
          }
          
          finalSlug = `${productSlug}-${slugSuffix}`;
          slugSuffix++;
        }

        console.log(`  📦 Creating product: ${productData.name} (${finalSlug})`);

        const [product] = await db
          .insert(products)
          .values({
            categoryId: category.id,
            name: productData.name,
            slug: finalSlug,
            description: productData.description || undefined,
            composition: productData.composition || undefined,
            indication: productData.indication || undefined,
            requiresApproval: false, // Default to false, can be updated later
            isActive: true,
            stockQuantity: 0, // Default stock, can be updated later
            lowStockThreshold: 10
          })
          .returning();

        if (!product) {
          console.log(`    ⚠️  Failed to create product: ${productData.name}`);
          continue;
        }

        // Create product variants (pack sizes)
        if (product) {
          for (const packSize of productData.packSizes) {
            if (!packSize.trim()) continue;

            // Set placeholder price (0.00) - you'll need to update these manually
            const price = "0.00";

            await db.insert(productVariants).values({
              productId: product.id,
              packSize: packSize.trim(),
              price,
              stockQuantity: 0, // Default stock, can be updated later
              isActive: true
            });

            console.log(`    ✓ Variant: ${packSize.trim()} (Price: $${price})`);
          }
        }
      }
      console.log("");
    }

    console.log("✅ Product seeding completed successfully!\n");
    console.log("⚠️  Note: All prices are set to $0.00. Please update prices manually or add pricing data to product.md\n");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the seed script
seedProducts()
  .then(() => {
    console.log("🎉 Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
