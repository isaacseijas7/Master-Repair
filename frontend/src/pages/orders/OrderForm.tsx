// frontend/src/pages/orders/OrderForm.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useOrderStore } from "@/stores/order.store";
import { useProductStore } from "@/stores/product.store";
import { useSupplierStore } from "@/stores/supplier.store";
import { MovementType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// ==========================================
// TIPOS LOCALES
// ==========================================

type MovementTypeType = (typeof MovementType)[keyof typeof MovementType];

// ==========================================
// SCHEMA DE VALIDACIÓN CON ZOD
// ==========================================

const orderItemSchema = z.object({
  product: z.string().min(1, "Producto requerido"),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number().min(1, "Cantidad mínima 1"),
  unitPrice: z.number().min(0, "Precio no puede ser negativo"),
  stock: z.number().optional(),
});

const orderFormSchema = z
  .object({
    type: z.enum(["purchase", "sale", "return", "adjustment"] as const),
    supplier: z.string().optional(),
    customerName: z.string().optional(),
    customerEmail: z
      .string()
      .email("Email inválido")
      .optional()
      .or(z.literal("")),
    customerPhone: z.string().optional(),
    items: z.array(orderItemSchema).min(1, "Agrega al menos un producto"),
    tax: z.number().min(0),
    discount: z.number().min(0),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "purchase" && !data.supplier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un proveedor",
        path: ["supplier"],
      });
    }

    if (
      (data.type === "sale" || data.type === "return") &&
      !data.customerName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ingresa el nombre del cliente",
        path: ["customerName"],
      });
    }
  });

// ==========================================
// TIPO EXPLÍCITO DEL FORMULARIO
// ==========================================

type OrderFormData = {
  type: "purchase" | "sale" | "return" | "adjustment";
  items: Array<{
    product: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    stock?: number;
  }>;
  tax: number;
  discount: number;
  supplier?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface OrderFormProps {
  onSuccess?: () => void;
}

export function OrderForm({ onSuccess }: OrderFormProps) {
  const { products, fetchProducts } = useProductStore();
  const { activeSuppliers, fetchActiveSuppliers } = useSupplierStore();
  const { createOrder } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      type: "sale",
      items: [],
      tax: 0,
      discount: 0,
      supplier: undefined,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchTax = watch("tax") ?? 0;
  const watchDiscount = watch("discount") ?? 0;
  const watchType = watch("type");

  const totals = useMemo(() => {
    const subtotal = watchItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal + watchTax - watchDiscount;
    return { subtotal, total };
  }, [watchItems, watchTax, watchDiscount]);

  useEffect(() => {
    fetchProducts({ limit: 100 });
    fetchActiveSuppliers();
  }, [fetchProducts, fetchActiveSuppliers]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, products]);

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto");
      return;
    }

    const product = products.find((p) => p._id === selectedProduct);
    if (!product) return;

    if (watchType === "sale" && product.stock < quantity) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const existingIndex = fields.findIndex(
      (item) => item.product === selectedProduct,
    );
    if (existingIndex >= 0) {
      toast.error("El producto ya está en la lista");
      return;
    }

    append({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      quantity: quantity,
      unitPrice: product.unitPrice,
      stock: product.stock,
    });

    setSelectedProduct("");
    setQuantity(1);
    setSearchTerm("");
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      await createOrder({
        type: data.type as MovementTypeType,
        items: data.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        tax: data.tax,
        discount: data.discount,
        supplier: data.supplier,
        customerName: data.customerName || undefined,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        notes: data.notes || undefined,
      });

      toast.success("Orden creada exitosamente");
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Error al crear la orden");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Order Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de Orden *</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MovementType.SALE}>Venta</SelectItem>
                  <SelectItem value={MovementType.PURCHASE}>Compra</SelectItem>
                  <SelectItem value={MovementType.RETURN}>
                    Devolución
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </div>

        {watchType === MovementType.PURCHASE ? (
          <div className="space-y-2">
            <Label>Proveedor *</Label>
            <Controller
              name="supplier"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || undefined)}
                >
                  <SelectTrigger
                    className={errors.supplier ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSuppliers.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplier && (
              <p className="text-sm text-red-500">{errors.supplier.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Nombre del Cliente *</Label>
            <Input
              {...register("customerName")}
              placeholder="Nombre completo"
              className={errors.customerName ? "border-red-500" : ""}
            />
            {errors.customerName && (
              <p className="text-sm text-red-500">
                {errors.customerName.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Customer Contact Info (for sales) */}
      {watchType === MovementType.SALE && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email (opcional)</Label>
            <Input
              type="email"
              {...register("customerEmail")}
              placeholder="cliente@email.com"
              className={errors.customerEmail ? "border-red-500" : ""}
            />
            {errors.customerEmail && (
              <p className="text-sm text-red-500">
                {errors.customerEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Teléfono (opcional)</Label>
            <Input
              {...register("customerPhone")}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      )}

      {/* Add Products */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Agregar Productos *
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                      onClick={() => {
                        setSelectedProduct(product._id);
                        setSearchTerm(product.name);
                      }}
                    >
                      <span>{product.name}</span>
                      <span className="text-sm text-gray-500">
                        {product.sku}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-3">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                placeholder="Cantidad"
              />
            </div>
            <div className="md:col-span-3">
              <Button
                type="button"
                onClick={handleAddItem}
                className="w-full"
                disabled={!selectedProduct}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>

          {errors.items && !Array.isArray(errors.items) && (
            <p className="text-sm text-red-500">{errors.items.message}</p>
          )}

          {/* Items Table */}
          {fields.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{field.productName}</p>
                        <p className="text-xs text-gray-500">{field.sku}</p>
                      </div>
                      <input
                        type="hidden"
                        {...register(`items.${index}.product`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.productName`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.sku`)}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.unitPrice`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Controller
                        name={`items.${index}.quantity`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={1}
                            className="w-20 text-right ml-auto"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(field.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(field.unitPrice * field.quantity)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Impuestos</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            {...register("tax", { valueAsNumber: true })}
            className={errors.tax ? "border-red-500" : ""}
          />
          {errors.tax && (
            <p className="text-sm text-red-500">{errors.tax.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Descuento</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            {...register("discount", { valueAsNumber: true })}
            className={errors.discount ? "border-red-500" : ""}
          />
          {errors.discount && (
            <p className="text-sm text-red-500">{errors.discount.message}</p>
          )}
        </div>
        <div className="flex items-end">
          <div className="w-full bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notas (opcional)</Label>
        <textarea
          {...register("notes")}
          className="w-full min-h-[80px] p-3 border rounded-md text-sm"
          placeholder="Notas adicionales sobre la orden..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando..." : "Crear Orden"}
        </Button>
      </div>
    </form>
  );
}
