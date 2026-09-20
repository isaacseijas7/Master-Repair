import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPhone extends Document {
  brandId: Types.ObjectId;
  // No puede llamarse `model`: es una clave reservada de Mongoose Document.
  phoneModel: string;
  salePrice: number;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const PhoneSchema = new Schema<IPhone>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'La marca es requerida'],
      index: true,
    },
    phoneModel: {
      type: String,
      required: [true, 'El modelo es requerido'],
      trim: true,
    },
    // Precio de venta en dólares estadounidenses (USD).
    salePrice: {
      type: Number,
      required: [true, 'El precio de venta es requerido'],
      min: [0, 'El precio de venta no puede ser negativo'],
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

// Un mismo modelo no se repite dentro de la misma marca (sin distinguir
// mayúsculas/minúsculas).
PhoneSchema.index(
  { brandId: 1, phoneModel: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export const Phone = mongoose.model<IPhone>('Phone', PhoneSchema);
