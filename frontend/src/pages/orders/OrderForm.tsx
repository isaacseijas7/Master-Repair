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
import { useDebounce } from "@/hooks/useDebounce";
import { isClientObject } from "@/helpers/isClientObject";
import { useOrderStore } from "@/stores/order.store";
import { useSupplierStore } from "@/stores/supplier.store";
import { ClientCreateDialog } from "@/pages/orders/components/ClientCreateDialog";
import { ClientSelector } from "@/pages/orders/components/ClientSelector";
import { productService } from "@/services/product.service";
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
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { isSupplierObject } from "@/helpers/isSupplierObject";
import type { Client, Product } from "@/types";

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
    client: z.string().optional(),
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
      !data.client
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecciona un cliente",
        path: ["client"],
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
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProductPreview, setSelectedProductPreview] = useState<Product | null>(null);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 250);

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
      client: undefined,
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = useWatch({ control, name: "items" }) ?? [];
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
        client: isClientObject(currentOrder.client)
          ? currentOrder.client._id
          : typeof currentOrder.client === "string"
            ? currentOrder.client
            : undefined,
        items: items,
        tax: currentOrder.tax || 0,
        discount: currentOrder.discount || 0,
        notes: currentOrder.notes || "",
      });

      setSelectedClient(isClientObject(currentOrder.client) ? currentOrder.client : null);
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

  useEffect(() => {
    if (watchType === MovementType.PURCHASE) {
      setSelectedClient(null);
      setValue("client", undefined);
    }
  }, [watchType, setValue]);

  const totals = useMemo(() => {
    const subtotal = watchItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const total = subtotal + watchTax - watchDiscount;
    return { subtotal, total };
  }, [watchItems, watchTax, watchDiscount]);

  useEffect(() => {
    fetchActiveSuppliers();
  }, [fetchActiveSuppliers]);

  useEffect(() => {
    let isCurrent = true;

    const searchProducts = async () => {
      const query = debouncedSearchTerm;

      if (!showProductList || query.length < 2) {
        if (isCurrent) {
          setProductResults([]);
          setIsSearchingProducts(false);
        }
        return;
      }

      setIsSearchingProducts(true);

      try {
        const response = await productService.getProducts({
          search: query,
          limit: 8,
          page: 1,
          sortBy: "name",
          sortOrder: "asc",
          isActive: true,
        });

        if (isCurrent) {
          setProductResults(response.data);
        }
      } catch {
        if (isCurrent) {
          setProductResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearchingProducts(false);
        }
      }
    };

    void searchProducts();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearchTerm, showProductList]);

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

  const handleAddItem = async () => {
    if (!selectedProduct) {
      toast.error("Selecciona un producto");
      return;
    }

    const qty = quantity === "" ? 1 : quantity;

    const existingIndex = fields.findIndex(
      (item) => item.product === selectedProduct,
    );
    if (existingIndex >= 0) {
      toast.error("El producto ya está en la lista");
      return;
    }

    try {
      const product = await productService.getProductById(selectedProduct);

      if (!product.isActive) {
        toast.error("El producto ya no está activo");
        return;
      }

      if (watchType === "sale" && product.stock < qty) {
        toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
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
      setSelectedProductPreview(null);
      setQuantity(1);
      setSearchTerm("");
      setShowProductList(false);
      setProductResults([]);
    } catch {
      toast.error("No se pudo validar la disponibilidad del producto");
    }
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
        client: data.client || undefined,
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

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product._id);
    setSearchTerm(product.name);
    setSelectedProductPreview(product);
    setShowProductList(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedProduct("");
    setSelectedProductPreview(null);
    setShowProductList(true);
    if (value === "") {
      setProductResults([]);
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

  const selectedQuantity = quantity === "" ? 1 : quantity;
  const isSelectionInvalid =
    watchType === "sale" &&
    !!selectedProductPreview &&
    selectedProductPreview.stock < selectedQuantity;

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setValue("client", client._id, { shouldDirty: true, shouldValidate: true });
  };

  const handleClientClear = () => {
    setSelectedClient(null);
    setValue("client", undefined, { shouldDirty: true, shouldValidate: true });
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
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Cliente *
                    </Label>
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                      <ClientSelector
                        selectedClient={selectedClient}
                        onSelectClient={handleClientSelect}
                        onClearSelection={handleClientClear}
                        error={errors.client?.message}
                      />
                      <ClientCreateDialog onClientCreated={handleClientSelect} />
                    </div>
                    {isEditing && currentOrder?.customerName && !selectedClient && (
                      <p className="text-xs text-amber-600">
                        Esta orden usa un cliente legado. Selecciona un cliente normalizado para guardar cambios.
                      </p>
                    )}
                  </div>
                )}
              </div>
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
                    {searchTerm && showProductList && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
                        {isSearchingProducts ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            Buscando productos...
                          </div>
                        ) : productResults.length > 0 ? (
                          <div className="max-h-72 overflow-auto">
                            {productResults.map((product) => (
                              <button
                                key={product._id}
                                type="button"
                                className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-b-0"
                                onClick={() => handleProductSelect(product)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                      {product.name}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      SKU: {product.sku}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {product.category && typeof product.category === "object"
                                        ? product.category.name
                                        : "Sin categoría"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {formatCurrency(product.unitPrice)}
                                    </p>
                                    <p className={`text-xs ${product.stock <= product.minStock ? "text-amber-600" : "text-gray-500"}`}>
                                      Stock: {product.stock}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No hay coincidencias. Prueba con otro nombre o SKU.
                          </div>
                        )}
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
                      disabled={!selectedProduct || isSelectionInvalid}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </div>
                </div>

                {selectedProductPreview && (
                  <div className="grid gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 md:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {selectedProductPreview.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            SKU: {selectedProductPreview.sku}
                          </p>
                        </div>
                        <Badge
                          variant={selectedProductPreview.isActive ? "default" : "secondary"}
                          className={selectedProductPreview.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}
                        >
                          {selectedProductPreview.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      {selectedProductPreview.description && (
                        <p className="mt-2 max-h-10 overflow-hidden text-sm text-gray-600">
                          {selectedProductPreview.description}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Precio</p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {formatCurrency(selectedProductPreview.unitPrice)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Stock</p>
                        <p className={`mt-1 font-semibold ${selectedProductPreview.stock <= selectedProductPreview.minStock ? "text-amber-600" : "text-gray-900"}`}>
                          {selectedProductPreview.stock} uds.
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-3 col-span-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Disponibilidad para esta orden</p>
                        <p className={`mt-1 font-medium ${watchType === "sale" && isSelectionInvalid ? "text-red-600" : "text-green-700"}`}>
                          {watchType === "sale"
                            ? isSelectionInvalid
                              ? `Stock insuficiente para ${selectedQuantity} unidades`
                              : `Disponible para ${selectedQuantity} unidades`
                            : "Disponible para compra"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
                                  max={watchType === "sale" ? watchItems[index]?.stock : undefined}
                                  className="w-20 text-right ml-auto"
                                  {...field}
                                  onChange={(e) => {
                                    const rawValue = e.target.value;
                                    const availableStock = watchItems[index]?.stock ?? undefined;

                                    if (rawValue === "") {
                                      field.onChange(1);
                                      return;
                                    }

                                    const nextQuantity = parseInt(rawValue, 10);

                                    if (Number.isNaN(nextQuantity) || nextQuantity < 1) {
                                      field.onChange(1);
                                      return;
                                    }

                                    if (
                                      watchType === "sale" &&
                                      availableStock !== undefined &&
                                      nextQuantity > availableStock
                                    ) {
                                      toast.error(
                                        `Solo hay ${availableStock} unidades disponibles para ${watchItems[index]?.sku ?? "este producto"}`,
                                      );
                                      field.onChange(availableStock);
                                      return;
                                    }

                                    field.onChange(nextQuantity);
                                  }}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(field.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(
                              field.unitPrice * (watchItems[index]?.quantity ?? field.quantity),
                            )}
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
        <div className="hidden space-y-6 lg:block">
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

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-gray-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
          </div>
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || fields.length === 0}
            className="min-w-40"
          >
            {isEditing ? "Actualizar" : "Crear orden"}
          </Button>
        </div>
        {fields.length === 0 && (
          <p className="mt-2 text-xs text-gray-500">Agrega al menos un producto para continuar.</p>
        )}
      </div>
    </div>
  );
}
