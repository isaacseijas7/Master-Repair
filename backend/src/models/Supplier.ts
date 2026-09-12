import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del proveedor es requerido'],
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    taxId: {
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
  }
);

// Antes no existía ningún índice único sobre "name": la única protección
// contra duplicados era un findOne() en el servicio antes de guardar, con
// condición de carrera (dos altas concurrentes con el mismo nombre podían
// pasar ambas). Este índice, igual al de Client.ts y Category.ts, hace la
// restricción real e insensible a mayúsculas a nivel de base de datos.
SupplierSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
SupplierSchema.index({ name: 'text', contactName: 'text', email: 'text' });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
