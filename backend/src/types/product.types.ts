import { IProduct } from "../models/Product";
import { Types, Document, FlattenMaps } from "mongoose";

// Producto como documento de Mongoose (con métodos como save(), populate, etc.)
export type ProductDocument = Document<unknown, {}, IProduct> & IProduct & { _id: Types.ObjectId };

// Producto como objeto plano (resultado de .lean())
// Usamos FlattenMaps directamente ya que es lo que devuelve Mongoose
export type LeanProduct = FlattenMaps<IProduct> & { _id: Types.ObjectId };

// Tipo genérico para resultados lean con populate
export type LeanProductWithPopulated = Omit<LeanProduct, 'category' | 'supplier'> & {
  category?: { _id: Types.ObjectId; name: string; color?: string } | null;
  supplier?: { _id: Types.ObjectId; name: string; contactName?: string } | null;
};