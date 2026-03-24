import { Product } from "../models/Product";
import { LeanProduct, ProductDocument } from "../types/product.types";

export class ProductService {
  async getProducts(
    filters: any = {},
  ): Promise<{ data: ProductDocument[]; pagination: any }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      category,
      supplier,
      minStock,
      isActive,
      minPrice,
      maxPrice,
    } = filters;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) query.category = category;
    if (supplier) query.supplier = supplier;
    if (minStock === true) query.$expr = { $lte: ["$stock", "$minStock"] };
    if (isActive !== undefined) query.isActive = isActive;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.unitPrice = {};
      if (minPrice !== undefined) query.unitPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.unitPrice.$lte = maxPrice;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name color")
        .populate("supplier", "name")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products as ProductDocument[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getProductById(id: string): Promise<ProductDocument> {
    const product = await Product.findById(id)
      .populate("category", "name color")
      .populate("supplier", "name contactName");
    if (!product) throw new Error("Producto no encontrado");
    return product;
  }

  async createProduct(productData: any): Promise<ProductDocument> {
    const existingProduct = await Product.findOne({
      sku: productData.sku.toUpperCase(),
    });
    if (existingProduct) {
      throw new Error("El SKU ya existe");
    }

    const product = new Product({
      ...productData,
      sku: productData.sku.toUpperCase(),
    });

    await product.save();
    return product.populate(["category", "supplier"]);
  }

  async updateProduct(id: string, updateData: any): Promise<ProductDocument> {
    const product = await Product.findById(id);
    if (!product) throw new Error("Producto no encontrado");

    if (updateData.sku && updateData.sku !== product.sku) {
      const existingProduct = await Product.findOne({
        sku: updateData.sku.toUpperCase(),
      });
      if (existingProduct) throw new Error("El SKU ya existe");
      updateData.sku = updateData.sku.toUpperCase();
    }

    Object.assign(product, updateData);
    await product.save();
    return product.populate(["category", "supplier"]);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) throw new Error("Producto no encontrado");
    product.isActive = false;
    await product.save();
  }

  async getLowStockProducts(limit: number = 20): Promise<LeanProduct[]> {
    console.log("getLowStockProducts");

    const products = await Product.find({
      $expr: { $lte: ["$stock", "$minStock"] },
      isActive: true,
    })
      .populate("category", "name color")
      .populate("supplier", "name")
      .sort({ stock: 1 })
      .limit(limit)
      .lean();

    return products;
  }
}

export const productService = new ProductService();
