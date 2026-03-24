import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceTier {
  minQuantity: number;
  price: number;
}

export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
  unitPrice: number;
  wholesalePrice?: number;
  priceTiers: IPriceTier[];
  stock: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

// Función para generar SKU automático
async function generateSKU(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Buscar el último producto creado hoy
  const prefix = `PROD-${year}${month}${day}-`;
  const lastProduct = await mongoose.model('Product').findOne({
    sku: { $regex: `^${prefix}` }
  }).sort({ sku: -1 });
  
  let sequence = 1;
  if (lastProduct) {
    const lastSequence = parseInt(lastProduct.sku.split('-')[2]);
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

const PriceTierSchema = new Schema<IPriceTier>(
  {
    minQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: [true, 'El SKU es requerido'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto es requerido'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La categoría es requerida'],
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    unitPrice: {
      type: Number,
      required: [true, 'El precio unitario es requerido'],
      min: [0, 'El precio no puede ser negativo'],
      default: 0,
    },
    wholesalePrice: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
    },
    priceTiers: {
      type: [PriceTierSchema],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    minStock: {
      type: Number,
      required: true,
      min: [0, 'El stock mínimo no puede ser negativo'],
      default: 5,
    },
    maxStock: {
      type: Number,
      min: [0, 'El stock máximo no puede ser negativo'],
    },
    location: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Middleware pre-save para generar SKU automático
ProductSchema.pre('save', async function(next) {
  if (!this.sku || this.sku === 'AUTO' || this.sku === '') {
    this.sku = await generateSKU();
  }
  next();
});

ProductSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.minStock;
});

ProductSchema.index({ name: 'text', description: 'text', sku: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ supplier: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stock: 1, minStock: 1 });

export { generateSKU };
export const Product = mongoose.model<IProduct>('Product', ProductSchema);