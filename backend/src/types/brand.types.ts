import { IBrand } from "../models/Brand";
import { Types, Document, FlattenMaps } from "mongoose";

export type BrandDocument = Document<unknown, {}, IBrand> &
  IBrand & { _id: Types.ObjectId };

export type LeanBrand = FlattenMaps<IBrand> & { _id: Types.ObjectId };
