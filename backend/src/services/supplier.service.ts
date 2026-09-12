import { Supplier } from "../models/Supplier";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { LeanSupplier, SupplierDocument } from "../types/supplier.types";

export class SupplierService {
  async getSuppliers(
    filters: any = {},
  ): Promise<{ data: LeanSupplier[]; pagination: any }> {
    const { page = 1, limit = 10, search, isActive } = filters;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { taxId: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Supplier.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: suppliers as LeanSupplier[],
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

  async getActiveSuppliers(): Promise<LeanSupplier[]> {
    const suppliers = await Supplier.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
    return suppliers as LeanSupplier[];
  }

  async getSupplierById(id: string): Promise<SupplierDocument> {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new Error("Proveedor no encontrado");
    return supplier as SupplierDocument;
  }

  async createSupplier(data: any): Promise<SupplierDocument> {
    const existingSupplier = await Supplier.findOne({
      name: { $regex: new RegExp(`^${data.name}$`, "i") },
    });
    if (existingSupplier)
      throw new Error("Ya existe un proveedor con ese nombre");

    const supplier = new Supplier(data);
    await supplier.save();
    return supplier as SupplierDocument;
  }

  async updateSupplier(id: string, data: any): Promise<SupplierDocument> {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new Error("Proveedor no encontrado");

    if (data.name && data.name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
      });
      if (existingSupplier)
        throw new Error("Ya existe un proveedor con ese nombre");
    }

    Object.assign(supplier, data);
    await supplier.save();
    return supplier as SupplierDocument;
  }

  async deleteSupplier(id: string): Promise<void> {
    const supplier = await Supplier.findById(id);
    if (!supplier) throw new Error("Proveedor no encontrado");

    const productCount = await Product.countDocuments({ supplier: id });
    if (productCount > 0) {
      throw new Error(
        `No se puede eliminar el proveedor porque tiene ${productCount} productos asociados`,
      );
    }

    // Antes solo se validaban productos asociados. Un proveedor sin
    // productos activos pero con órdenes de compra históricas (Order.supplier
    // referencia al proveedor directamente) podía eliminarse igual, dejando
    // esas órdenes con una referencia rota.
    const orderCount = await Order.countDocuments({ supplier: id });
    if (orderCount > 0) {
      throw new Error(
        `No se puede eliminar el proveedor porque tiene ${orderCount} órdenes asociadas`,
      );
    }

    await Supplier.findByIdAndDelete(id);
  }
}

export const supplierService = new SupplierService();
