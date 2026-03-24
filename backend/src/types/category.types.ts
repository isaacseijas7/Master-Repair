import { ICategory } from "../models/Category";
import { Types, Document, FlattenMaps } from "mongoose";

export type CategoryDocument = Document<unknown, {}, ICategory> &
  ICategory & { _id: Types.ObjectId };

export type LeanCategory = FlattenMaps<ICategory> & { _id: Types.ObjectId };
