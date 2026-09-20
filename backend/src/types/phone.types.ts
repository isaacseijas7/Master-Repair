import { IPhone } from "../models/Phone";
import { Types, Document, FlattenMaps } from "mongoose";

export type PhoneDocument = Document<unknown, {}, IPhone> &
  IPhone & { _id: Types.ObjectId };

export type LeanPhone = FlattenMaps<IPhone> & { _id: Types.ObjectId };
