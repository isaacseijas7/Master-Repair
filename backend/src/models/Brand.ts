import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la marca es requerido'],
      trim: true,
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
  }
);

// Único e insensible a mayúsculas/minúsculas a nivel de base de datos
// (mismo criterio que Category.ts).
BrandSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
