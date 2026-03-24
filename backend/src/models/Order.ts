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
OrderSchema.index({ createdAt: -1 });

OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const prefix =
      this.type === MovementType.PURCHASE
        ? "OC"
        : this.type === MovementType.SALE
          ? "VE"
          : this.type === MovementType.RETURN
            ? "DE"
            : "AJ";
    const timestamp = date.getTime().toString(36).toUpperCase();
    this.orderNumber = `${prefix}-${timestamp}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
