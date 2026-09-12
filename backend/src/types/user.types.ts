import { IUser } from "../models/User";
import { Types, Document, FlattenMaps } from "mongoose";

export type UserDocument = Document<unknown, {}, IUser> & IUser & { _id: Types.ObjectId };

export type LeanUser = FlattenMaps<IUser> & { _id: Types.ObjectId };
