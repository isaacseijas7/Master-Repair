import { IScreen } from "../models/Screen";
import { Types, Document, FlattenMaps } from "mongoose";

export type ScreenDocument = Document<unknown, {}, IScreen> &
  IScreen & { _id: Types.ObjectId };

export type LeanScreen = FlattenMaps<IScreen> & { _id: Types.ObjectId };
