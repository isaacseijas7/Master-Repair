import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IScreen extends Document {
  brandId: Types.ObjectId;
  // No puede llamarse `model`: es una clave reservada de Mongoose Document.
  screenModel: string;
  // Precio de venta al por mayor (USD). Se llama `salePrice` por historia: es
  // el campo original del catálogo. Debe existir al menos uno de `salePrice` y
  // `unitSalePrice` (lo valida el servicio).
  salePrice?: number | null;
  // Precio de venta unitario (USD). Opcional: los registros anteriores no lo tienen.
  unitSalePrice?: number | null;
  // Precio de compra al proveedor (USD). Opcional. Dato interno: solo lo ven admin/manager.
  purchasePrice?: number | null;
  // true si la pantalla es de mecánico (proveedor especial). Solo sirve para
  // distinguirlas y filtrar la exportación; los registros anteriores no lo
  // tienen y se tratan como "no mecánico".
  isMechanic: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const ScreenSchema = new Schema<IScreen>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'La marca es requerida'],
      index: true,
    },
    screenModel: {
      type: String,
      required: [true, 'El modelo es requerido'],
      trim: true,
    },
    // Precio de venta al por mayor en dólares estadounidenses (USD).
    salePrice: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    unitSalePrice: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    purchasePrice: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    isMechanic: {
      type: Boolean,
      default: false,
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
ScreenSchema.index(
  { brandId: 1, screenModel: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

export const Screen = mongoose.model<IScreen>('Screen', ScreenSchema);
