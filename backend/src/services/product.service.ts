import { generateSKU, Product } from "../models/Product";
import { Category } from "../models/Category";
import { LeanProduct, ProductDocument } from "../types/product.types";
import { addBanner, applyBannerSize, BANNER_ROWS } from "../utils/excelBanner";

export class ProductService {
  private async buildSearchOr(search: string): Promise<any[]> {
    const regex = { $regex: search, $options: "i" };
    const or: any[] = [
      { name: regex },
      { sku: regex },
      { description: regex },
      { brand: regex },
    ];

    const matchingCategories = await Category.find(
      { $or: [{ name: regex }, { description: regex }] },
      "_id",
    ).lean();

    if (matchingCategories.length > 0) {
      or.push({ category: { $in: matchingCategories.map((c) => c._id) } });
    }

    return or;
  }

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
      brand,
      minStock,
      isActive,
      minPrice,
      maxPrice,
    } = filters;

    const query: any = {};

    if (search) {
      query.$or = await this.buildSearchOr(search);
    }

    if (category) query.category = category;
    if (supplier) query.supplier = supplier;
    if (brand) query.brand = { $regex: `^${brand}$`, $options: "i" };
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

  async generateSKU(): Promise<string> {
    return generateSKU();
  }

  async createProduct(productData: any): Promise<ProductDocument> {
    if (!productData.sku || productData.sku === "AUTO") {
      productData.sku = await generateSKU();
    } else {
      const existingProduct = await Product.findOne({
        sku: productData.sku.toUpperCase(),
      });
      if (existingProduct) {
        throw new Error("El SKU ya existe");
      }
      productData.sku = productData.sku.toUpperCase();
    }

    const product = new Product(productData);
    await product.save();
    return product.populate(["category", "supplier"]);
  }

  async updateProduct(id: string, updateData: any): Promise<ProductDocument> {
    const product = await Product.findById(id);
    if (!product) throw new Error("Producto no encontrado");

    if (updateData.sku && updateData.sku !== product.sku) {
      if (updateData.sku === "AUTO") {
        updateData.sku = await generateSKU();
      } else {
        const existingProduct = await Product.findOne({
          sku: updateData.sku.toUpperCase(),
        });
        if (existingProduct) throw new Error("El SKU ya existe");
        updateData.sku = updateData.sku.toUpperCase();
      }
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

  async exportProducts(
    filters: any = {},
    columns: string[] = [],
  ): Promise<Buffer> {
    const ExcelJS = require("exceljs");

    // Reutilizar lógica de filtros pero SIN paginación (limit = 0 o muy alto)
    const {
      search,
      category,
      supplier,
      brand,
      minStock,
      isActive,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query: any = {};

    if (search) {
      query.$or = await this.buildSearchOr(search);
    }

    if (category) query.category = category;
    if (supplier) query.supplier = supplier;
    if (brand) query.brand = { $regex: `^${brand}$`, $options: "i" };
    if (minStock === true) query.$expr = { $lte: ["$stock", "$minStock"] };
    if (isActive !== undefined) query.isActive = isActive;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.unitPrice = {};
      if (minPrice !== undefined) query.unitPrice.$gte = minPrice;
      if (maxPrice !== undefined) query.unitPrice.$lte = maxPrice;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Traer TODOS los productos sin paginar
    const products = await Product.find(query)
      .populate("category", "name color")
      .populate("supplier", "name contactName")
      .sort(sort)
      .lean();

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Productos");

    // Definir columnas disponibles y sus configuraciones
    const columnDefinitions: Record<string, any> = {
      sku: { header: "SKU", key: "sku", width: 20 },
      name: { header: "Nombre", key: "name", width: 40 },
      description: { header: "Descripción", key: "description", width: 50 },
      brand: { header: "Marca", key: "brand", width: 20 },
      category: { header: "Categoría", key: "category", width: 20 },
      unitPrice: { header: "Precio Unitario", key: "unitPrice", width: 15 },
      wholesalePrice: {
        header: "Precio Mayorista",
        key: "wholesalePrice",
        width: 15,
      },
      stock: { header: "Stock", key: "stock", width: 10 },
      minStock: { header: "Stock Mínimo", key: "minStock", width: 15 },
      maxStock: { header: "Stock Máximo", key: "maxStock", width: 15 },
      supplier: { header: "Proveedor", key: "supplier", width: 25 },
      location: { header: "Ubicación", key: "location", width: 20 },
      barcode: { header: "Código de Barras", key: "barcode", width: 20 },
      isActive: { header: "Estado", key: "isActive", width: 12 },
      createdAt: { header: "Fecha Creación", key: "createdAt", width: 20 },
    };

    // Si no se especifican columnas, usar todas
    const selectedColumns =
      columns.length > 0 ? columns : Object.keys(columnDefinitions);

    // Configurar columnas (solo key y ancho: el encabezado se escribe abajo,
    // después del banner)
    worksheet.columns = selectedColumns.map((col) => ({
      key: columnDefinitions[col].key,
      width: columnDefinitions[col].width,
    }));

    // Banner con el logo en las filas 1-2, una fila de separación y luego el
    // encabezado de la tabla.
    const banner = addBanner(
      workbook,
      worksheet,
      selectedColumns.map((col) => columnDefinitions[col].width),
      "left",
    );
    const headerRowNumber = BANNER_ROWS + 2;
    worksheet.getRow(BANNER_ROWS + 1).height = 12;

    const headerRow = worksheet.getRow(headerRowNumber);
    selectedColumns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = columnDefinitions[col].header;
      cell.font = { bold: true, size: 12 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    });

    // Agregar datos
    products.forEach((product: any) => {
      const row: any = {};

      selectedColumns.forEach((col) => {
        switch (col) {
          case "category":
            row[col] = product.category?.name || "-";
            break;
          case "supplier":
            row[col] = product.supplier?.name || "-";
            break;
          case "isActive":
            row[col] = product.isActive ? "Activo" : "Inactivo";
            break;
          case "unitPrice":
          case "wholesalePrice":
            row[col] = product[col] || 0;
            break;
          case "createdAt":
            row[col] = new Date(product.createdAt).toLocaleDateString("es-ES");
            break;
          default:
            row[col] = product[col] || "-";
        }
      });

      const excelRow = worksheet.addRow(row);

      // Aplicar estilos condicionales (ej: stock bajo en rojo)
      if (
        selectedColumns.includes("stock") &&
        selectedColumns.includes("minStock")
      ) {
        const stockIndex = selectedColumns.indexOf("stock") + 1;
        const stockValue = product.stock;
        const minStockValue = product.minStock;

        if (stockValue <= minStockValue) {
          excelRow.getCell(stockIndex).font = {
            color: { argb: "FFFF0000" },
            bold: true,
          };
        }
      }
    });

    // Auto-filtros sobre el encabezado de la tabla. No se congela el
    // encabezado: quedaría fijo junto con el banner y ocuparía media pantalla.
    worksheet.autoFilter = {
      from: { row: headerRowNumber, column: 1 },
      to: { row: headerRowNumber, column: selectedColumns.length },
    };

    // Generar buffer
    return applyBannerSize(Buffer.from(await workbook.xlsx.writeBuffer()), banner);
  }
}

export const productService = new ProductService();
