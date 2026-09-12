import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es requerido'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
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
  }
);

// Antes el campo tenía "unique: true" a nivel de esquema, que en MongoDB es
// sensible a mayúsculas/minúsculas. El chequeo manual del servicio (regex
// case-insensitive) no coincidía con esa restricción, así que dos altas
// concurrentes con distinta capitalización (ej. "Accesorios" / "accesorios")
// podían colarse como duplicados. Este índice con collation replica al de
// Client.ts: único e insensible a mayúsculas, a nivel de base de datos.
CategorySchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
CategorySchema.index({ name: 'text', description: 'text' });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
