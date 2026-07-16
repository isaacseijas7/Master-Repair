import mongoose, { Document, Schema } from "mongoose";

export interface IClient extends Document {
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const ClientSchema = new Schema<IClient>(
  {
    name: {
      type: String,
      required: [true, "El nombre del cliente es requerido"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

ClientSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
ClientSchema.index({ email: 1 }, { unique: true, sparse: true, collation: { locale: "en", strength: 2 } });
ClientSchema.index({ name: "text", email: "text", phone: "text" });

export const Client = mongoose.model<IClient>("Client", ClientSchema);