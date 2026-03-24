import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { useOrderStore } from "@/stores/order.store";
import { useProductStore } from "@/stores/product.store";
import { useSupplierStore } from "@/stores/supplier.store";
import { MovementType, OrderStatus, type MovementTypeType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Package,
  Plus,
  Search,
  Trash2,
  ShoppingCart,
  User,
  Building2,
  Receipt,
  Calculator,
  FileText,
  ArrowRightLeft,
  Store,
  ArrowLeft,
  Banknote,
  CreditCard,
  AlertCircle,
  Edit,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { isSupplierObject } from "@/helpers/isSupplierObject";

// ==========================================
// TIPOS Y SCHEMA (sin cambios)
// ==========================================

const PaymentType = {
  CASH: "cash",
  CREDIT: "credit",
} as const;

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
    paymentType: z.enum(["cash", "credit"] as const).optional(),
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

    if (data.type === "sale" && !data.paymentType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona el tipo de pago",
        path: ["paymentType"],
      });
    }
  });

type OrderFormData = z.infer<typeof orderFormSchema>;

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface OrderFormProps {
  orderId?: string;
  onSuccess?: () => void;
}

export function OrderForm({ orderId: propOrderId, onSuccess }: OrderFormProps) {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = propOrderId || paramId; // Soporta prop o URL param

  const isEditing = !!orderId;

  const { products, fetchProducts } = useProductStore();
  const { activeSuppliers, fetchActiveSuppliers } = useSupplierStore();
  const {
    createOrder,
    updateOrder,
    fetchOrderById,
    currentOrder,
    isLoading: storeLoading,
  } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [showProductList, setShowProductList] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      type: "sale",
      paymentType: "cash",
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
  const watchPaymentType = watch("paymentType");

  // Cargar orden existente si estamos editando
  useEffect(() => {
    if (isEditing && orderId) {
      setIsLoadingOrder(true);
      fetchOrderById(orderId).finally(() => {
        setIsLoadingOrder(false);
      });
    }
  }, [isEditing, orderId, fetchOrderById]);

  // Precargar datos de la orden en el formulario
  useEffect(() => {
    if (isEditing && currentOrder && orderId === currentOrder._id) {
      // Verificar si es editable (solo pending)
      if (currentOrder.status !== OrderStatus.PENDING) {
        return; // No precargar si no es editable, mostrará alerta abajo
      }

      // Precargar items
      const items = currentOrder.items.map((item: any) => ({
        product: item.product._id || item.product,
        productName: item.product.name || item.productName,
        sku: item.product.sku || item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        stock: item.product.stock,
      }));

      reset({
        type: currentOrder.type,
        paymentType: currentOrder.paymentType,
        supplier: isSupplierObject(currentOrder.supplier)
          ? currentOrder.supplier?._id
          : currentOrder.supplier,
        customerName: currentOrder.customerName || "",
        customerEmail: currentOrder.customerEmail || "",
        customerPhone: currentOrder.customerPhone || "",
        items: items,
        tax: currentOrder.tax || 0,
        discount: currentOrder.discount || 0,
        notes: currentOrder.notes || "",
      });
    }
  }, [isEditing, currentOrder, orderId, reset]);

  // Payment type effect (sin cambios)
  useEffect(() => {
    if (watchType === "sale") {
      if (!watchPaymentType) {
        setValue("paymentType", "cash");
      }
    } else {
      setValue("paymentType", undefined);
    }
  }, [watchType, watchPaymentType, setValue]);

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
    if (!searchTerm || !showProductList) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, products, showProductList]);

  const isEditable = useMemo(() => {
    if (!isEditing) return true;
    if (!currentOrder) return false;
    return currentOrder.status === OrderStatus.PENDING;
  }, [isEditing, currentOrder]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case MovementType.SALE:
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case MovementType.PURCHASE:
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case MovementType.RETURN:
        return <ArrowRightLeft className="w-4 h-4 text-orange-500" />;
      default:
        return <Store className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case MovementType.SALE:
        return "Venta";
      case MovementType.PURCHASE:
        return "Compra";
      case MovementType.RETURN:
        return "Devolución";
      case MovementType.ADJUSTMENT:
        return "Ajuste";
      default:
        return type;
    }
  };

  const getPaymentIcon = (paymentType: string | undefined) => {
    switch (paymentType) {
      case PaymentType.CASH:
        return <Banknote className="w-4 h-4 text-green-500" />;
      case PaymentType.CREDIT:
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      default:
        return <Banknote className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentLabel = (paymentType: string | undefined) => {
    switch (paymentType) {
      case PaymentType.CASH:
        return "Contado";
      case PaymentType.CREDIT:
        return "Crédito";
      default:
        return "Contado";
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto");
      return;
    }

    const product = products.find((p) => p._id === selectedProduct);
    if (!product) return;

    const qty = quantity === "" ? 1 : quantity;

    if (watchType === "sale" && product.stock < qty) {
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
      quantity: qty,
      unitPrice: product.unitPrice,
      stock: product.stock,
    });

    setSelectedProduct("");
    setQuantity(1);
    setSearchTerm("");
    setShowProductList(false);
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      const orderPayload: any = {
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
      };

      if (data.type === "sale" && data.paymentType) {
        orderPayload.paymentType = data.paymentType;
      }

      if (isEditing && orderId) {
        // ACTUALIZAR
        await updateOrder(orderId, orderPayload);
        toast.success("Orden actualizada exitosamente");
        navigate(`/orders/${orderId}`);
      } else {
        // CREAR NUEVA
        const createdOrder = await createOrder(orderPayload);
        toast.success("Orden creada exitosamente");

        if (createdOrder && createdOrder._id) {
          navigate(`/orders/${createdOrder._id}`);
        } else {
          reset();
          onSuccess?.();
        }
      }
    } catch (error) {
      toast.error(
        isEditing ? "Error al actualizar la orden" : "Error al crear la orden",
      );
    }
  };

  const handleProductSelect = (product: (typeof products)[0]) => {
    setSelectedProduct(product._id);
    setSearchTerm(product.name);
    setShowProductList(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowProductList(true);
    if (value === "") {
      setSelectedProduct("");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setQuantity("");
    } else {
      const numValue = parseInt(value);
      setQuantity(isNaN(numValue) ? 1 : numValue);
    }
  };

  // Loading state
  if (isLoadingOrder || storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Si está editando y no es editable, mostrar mensaje
  if (isEditing && currentOrder && !isEditable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Orden</h1>
            <p className="text-gray-500">Orden #{orderId?.slice(-6)}</p>
          </div>
        </div>

        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Esta orden no puede ser editada porque su estado es{" "}
              <strong>
                {currentOrder.status === OrderStatus.COMPLETED
                  ? "Completada"
                  : currentOrder.status === OrderStatus.CANCELLED
                    ? "Cancelada"
                    : currentOrder.status}
              </strong>
              . Solo las órdenes en estado "Pendiente" pueden editarse.
            </span>
            <Button
              variant="outline"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              Ver Detalles
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Editar Orden" : "Nueva Orden"}
            </h1>
            <p className="text-gray-500">
              {isEditing
                ? `Modificando orden #${orderId?.slice(-6)}`
                : "Crea una nueva orden de compra, venta o devolución"}
            </p>
          </div>
        </div>

        {isEditing && (
          <Badge
            variant="outline"
            className="bg-yellow-50 border-yellow-200 text-yellow-700"
          >
            <Edit className="w-3 h-3 mr-1" />
            Modo Edición
          </Badge>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Form - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Type & Client/Supplier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {getTypeIcon(watchType)}
                Información de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Type */}
                <div className="space-y-2">
                  <Label>Tipo de Orden *</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEditing} // No permitir cambiar tipo en edición
                      >
                        <SelectTrigger
                          className={errors.type ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={MovementType.SALE}>
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4 text-blue-500" />
                              Venta
                            </div>
                          </SelectItem>
                          <SelectItem value={MovementType.PURCHASE}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-purple-500" />
                              Compra
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-sm text-red-500">
                      {errors.type.message}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-gray-400">
                      El tipo de orden no se puede modificar en edición
                    </p>
                  )}
                </div>

                {/* Payment Type - Solo visible para ventas */}
                {watchType === MovementType.SALE && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Tipo de Pago *
                    </Label>
                    <Controller
                      name="paymentType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || "cash"}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            className={
                              errors.paymentType ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Seleccionar tipo de pago" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PaymentType.CASH}>
                              <div className="flex items-center gap-2">
                                <Banknote className="w-4 h-4 text-green-500" />
                                Contado
                              </div>
                            </SelectItem>
                            <SelectItem value={PaymentType.CREDIT}>
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-blue-500" />
                                Crédito
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.paymentType && (
                      <p className="text-sm text-red-500">
                        {errors.paymentType.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Dynamic Field: Supplier or Customer */}
                {watchType === MovementType.PURCHASE ? (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Proveedor *
                    </Label>
                    <Controller
                      name="supplier"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(val) =>
                            field.onChange(val || undefined)
                          }
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
                      <p className="text-sm text-red-500">
                        {errors.supplier.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nombre del Cliente *
                    </Label>
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

              {/* Customer Contact Info (for sales/returns) */}
              {watchType !== MovementType.PURCHASE && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Product */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar producto por nombre o SKU..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10 bg-white"
                    />
                    {searchTerm &&
                      showProductList &&
                      filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                          {filteredProducts.map((product) => (
                            <button
                              key={product._id}
                              type="button"
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center border-b last:border-0"
                              onClick={() => handleProductSelect(product)}
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Stock: {product.stock} |{" "}
                                  {formatCurrency(product.unitPrice)}
                                </p>
                              </div>
                              <span className="text-xs font-mono text-gray-400">
                                {product.sku}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      placeholder="Cant."
                      className="bg-white"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                      disabled={!selectedProduct}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>
                </div>
              </div>

              {errors.items && !Array.isArray(errors.items) && (
                <p className="text-sm text-red-500">{errors.items.message}</p>
              )}

              {/* Items Table */}
              {fields.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[40%]">Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {field.productName}
                              </p>
                              <p className="text-xs text-gray-500">
                                SKU: {field.sku}
                              </p>
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
                                    field.onChange(
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right text-sm">
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
                              className="h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay productos agregados</p>
                  <p className="text-xs">Busca y agrega productos a la orden</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Notas Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                {...register("notes")}
                className="w-full min-h-[100px] p-3 border rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Agrega notas o comentarios sobre esta orden..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5" />
                Resumen de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type Badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo:</span>
                <Badge variant="outline" className="font-medium">
                  {getTypeIcon(watchType)}
                  <span className="ml-1">{getTypeLabel(watchType)}</span>
                </Badge>
              </div>

              {/* Payment Type Badge - Solo para ventas */}
              {watchType === MovementType.SALE && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pago:</span>
                  <Badge
                    variant="outline"
                    className={`font-medium ${
                      watchPaymentType === "cash"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    {getPaymentIcon(watchPaymentType)}
                    <span className="ml-1">
                      {getPaymentLabel(watchPaymentType)}
                    </span>
                  </Badge>
                </div>
              )}

              <Separator />

              {/* Items Count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Productos:</span>
                <span className="font-medium">{fields.length} items</span>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>

              <Separator />

              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || fields.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {isEditing ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    {isEditing ? "Actualizar Orden" : "Crear Orden"}
                  </>
                )}
              </Button>

              {fields.length === 0 && (
                <p className="text-xs text-center text-gray-500">
                  Agrega al menos un producto para{" "}
                  {isEditing ? "actualizar" : "crear"} la orden
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
