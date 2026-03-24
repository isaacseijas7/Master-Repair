import { ISupplier } from "../models/Supplier";
import { Types, Document, FlattenMaps } from "mongoose";

export type SupplierDocument = Document<unknown, {}, ISupplier> & ISupplier & { _id: Types.ObjectId };

export type LeanSupplier = FlattenMaps<ISupplier> & { _id: Types.ObjectId };