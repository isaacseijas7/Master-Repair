import mongoose, { Schema, Document } from "mongoose";

export const MovementType = {
  PURCHASE: "purchase",
  SALE: "sale",
  ADJUSTMENT: "adjustment",
  RETURN: "return",
} as const;

export const OrderStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// NUEVO: Tipo de pago
export const PaymentType = {
  CASH: "cash",
  CREDIT: "credit",
} as const;

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  type: (typeof MovementType)[keyof typeof MovementType];
  status: (typeof OrderStatus)[keyof typeof OrderStatus];
  paymentType: (typeof PaymentType)[keyof typeof PaymentType]; // NUEVO
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  supplier?: mongoose.Types.ObjectId;
  client?: mongoose.Types.ObjectId;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: any;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(MovementType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    // NUEVO: Campo paymentType
    paymentType: {
      type: String,
      enum: Object.values(PaymentType),
      default: PaymentType.CASH, // Por defecto: contado
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
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
  },
);

OrderSchema.index({ type: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentType: 1 });
OrderSchema.index({ client: 1 });
OrderSchema.index({ createdAt: -1 });
// Respalda las agregaciones del dashboard (ventas de hoy, ingresos
// mensuales, top productos, ventas por categoría), que siempre filtran por
// esta combinación exacta de campos. Antes solo existían índices de un solo
// campo: con una prueba real de 5,000 órdenes, la consulta de "ventas de
// hoy" examinaba dos tercios de toda la colección para devolver 2
// resultados. Este índice le permite a MongoDB ir directo al rango.
OrderSchema.index({ status: 1, type: 1, completedAt: 1 });

// Genera un número de orden legible y con muy baja probabilidad de colisión:
// prefijo por tipo + timestamp en base36 + sufijo aleatorio de 4 caracteres.
// Además, antes de aceptarlo, verifica contra la colección que no exista ya
// (con reintentos), porque el campo tiene un índice único que de otra forma
// rechazaría la orden con un error genérico de base de datos.
OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const prefix =
      this.type === MovementType.PURCHASE
        ? "OC"
        : this.type === MovementType.SALE
          ? "VE"
          : this.type === MovementType.RETURN
            ? "DE"
            : "AJ";

    const OrderModel = this.constructor as mongoose.Model<IOrder>;
    let orderNumber = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomSuffix = Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase();
      orderNumber = `${prefix}-${timestamp}-${randomSuffix}`;
      // eslint-disable-next-line no-await-in-loop
      const existing = await OrderModel.exists({ orderNumber });
      isUnique = !existing;
      attempts++;
    }

    this.orderNumber = orderNumber;
  }
  next();
});

export const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);
