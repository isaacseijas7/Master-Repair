import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProductStore } from "@/stores/product.store";
import { useCategoryStore } from "@/stores/category.store";
import { useSupplierStore } from "@/stores/supplier.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  Boxes,
  Tag,
  Building,
  MapPin,
  Barcode,
  Trash2,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// ==========================================
// 1. SCHEMA DE VALIDACIÓN CON ZOD
// ==========================================

const priceTierSchema = z.object({
  minQuantity: z.number().min(1, "La cantidad mínima debe ser al menos 1"),
  price: z.number().min(0, "El precio no puede ser negativo"),
});

const productFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  sku: z
    .string()
    .min(1, "El SKU es obligatorio")
    .max(50, "Máximo 50 caracteres"),
  description: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Debes seleccionar una categoría"),
  supplier: z.string().min(1, "Debes seleccionar un proveedor"),
  unitPrice: z.number().min(0.01, "El precio unitario debe ser mayor a 0"),
  wholesalePrice: z
    .number()
    .min(0, "El precio mayorista no puede ser negativo")
    .optional(),
  stock: z.number().int().min(0, "El stock no puede ser negativo"),
  minStock: z.number().int().min(0, "El stock mínimo no puede ser negativo"),
  maxStock: z
    .number()
    .int()
    .min(0, "El stock máximo no puede ser negativo")
    .optional(),
  location: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
  barcode: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean(),
  priceTiers: z.array(priceTierSchema),
});

// ==========================================
// 2. TIPO EXPLÍCITO DEL FORMULARIO
// ==========================================

type ProductFormData = {
  name: string;
  sku: string;
  description?: string;
  category: string;
  supplier: string;
  unitPrice: number;
  wholesalePrice?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  barcode?: string;
  isActive: boolean;
  priceTiers: Array<{ minQuantity: number; price: number }>;
};

// ==========================================
// 3. VALORES POR DEFECTO
// ==========================================

const DEFAULT_VALUES: ProductFormData = {
  name: "",
  sku: "",
  description: "",
  category: "",
  supplier: "",
  unitPrice: 0,
  wholesalePrice: 0,
  stock: 0,
  minStock: 5,
  maxStock: 0,
  location: "",
  barcode: "",
  isActive: true,
  priceTiers: [],
};

// ==========================================
// 4. COMPONENTE PRINCIPAL
// ==========================================

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Stores
  const {
    currentProduct,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    isLoading: isStoreLoading,
    clearCurrentProduct,
  } = useProductStore();

  const { activeCategories, fetchActiveCategories } = useCategoryStore();
  const { activeSuppliers, fetchActiveSuppliers } = useSupplierStore();

  // ==========================================
  // 5. CONFIGURACIÓN DE REACT-HOOK-FORM
  // ==========================================

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // Field array para escalas de precio
  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceTiers",
  });

  // Watch para mostrar estado de stock en tiempo real
  const watchedStock = watch("stock");
  const watchedMinStock = watch("minStock");
  const isLowStock = watchedStock <= watchedMinStock;

  // ==========================================
  // 6. EFECTOS
  // ==========================================

  useEffect(() => {
    fetchActiveCategories();
    fetchActiveSuppliers();

    return () => clearCurrentProduct();
  }, [fetchActiveCategories, fetchActiveSuppliers, clearCurrentProduct]);

  useEffect(() => {
    if (isEditMode && id) {
      fetchProductById(id);
    }
  }, [isEditMode, id, fetchProductById]);

  useEffect(() => {
    if (isEditMode && currentProduct) {
      const formData: ProductFormData = {
        name: currentProduct.name,
        sku: currentProduct.sku,
        description: currentProduct.description || "",
        category:
          typeof currentProduct.category === "object"
            ? currentProduct.category._id
            : currentProduct.category,
        supplier: currentProduct.supplier
          ? typeof currentProduct.supplier === "object"
            ? currentProduct.supplier._id
            : currentProduct.supplier
          : "",
        unitPrice: currentProduct.unitPrice,
        wholesalePrice: currentProduct.wholesalePrice || 0,
        stock: currentProduct.stock,
        minStock: currentProduct.minStock,
        maxStock: currentProduct.maxStock || 0,
        location: currentProduct.location || "",
        barcode: currentProduct.barcode || "",
        isActive: currentProduct.isActive,
        priceTiers: currentProduct.priceTiers || [],
      };

      reset(formData);
    }
  }, [currentProduct, isEditMode, reset]);

  // ==========================================
  // 7. HANDLERS
  // ==========================================

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEditMode && id) {
        await updateProduct(id, data);
        toast.success("Producto actualizado exitosamente");
      } else {
        await createProduct(data);
        toast.success("Producto creado exitosamente");
        navigate("/products");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        `Error al ${isEditMode ? "actualizar" : "crear"} el producto`;
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      confirm(
        "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.",
      )
    ) {
      try {
        await deleteProduct(id);
        toast.success("Producto eliminado");
        navigate("/products");
      } catch (error) {
        toast.error("Error al eliminar el producto");
      }
    }
  };

  const handleAddPriceTier = () => {
    append({ minQuantity: 1, price: 0 });
  };

  // ==========================================
  // 8. RENDERIZADO CONDICIONAL (LOADING)
  // ==========================================

  if (isStoreLoading || (isEditMode && !currentProduct)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // ==========================================
  // 9. RENDER PRINCIPAL
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Editar Producto" : "Nuevo Producto"}
            </h1>
            <p className="text-gray-500">
              {isEditMode && currentProduct
                ? currentProduct.name
                : "Completa la información del producto"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || (!isDirty && isEditMode)}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting
              ? isEditMode
                ? "Guardando..."
                : "Creando..."
              : isEditMode
                ? "Guardar Cambios"
                : "Crear Producto"}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    {...register("sku", {
                      onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase();
                      },
                    })}
                    className={errors.sku ? "border-red-500" : ""}
                  />
                  {errors.sku && (
                    <p className="text-sm text-red-500">{errors.sku.message}</p>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  {...register("description")}
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                  placeholder="Descripción del producto..."
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Categoría */}
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={errors.category ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCategories.map((cat) => (
                            <SelectItem key={cat._id} value={cat._id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-sm text-red-500">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {/* Proveedor */}
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Controller
                    name="supplier"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className={errors.supplier ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSuppliers.map((sup) => (
                            <SelectItem key={sup._id} value={sup._id}>
                              {sup.name}
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
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Precios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Precio Unitario */}
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Precio Unitario *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("unitPrice", { valueAsNumber: true })}
                    className={errors.unitPrice ? "border-red-500" : ""}
                  />
                  {errors.unitPrice && (
                    <p className="text-sm text-red-500">
                      {errors.unitPrice.message}
                    </p>
                  )}
                </div>

                {/* Precio Mayorista */}
                {/* <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Precio Mayorista</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("wholesalePrice", { valueAsNumber: true })}
                    className={errors.wholesalePrice ? "border-red-500" : ""}
                  />
                  {errors.wholesalePrice && (
                    <p className="text-sm text-red-500">
                      {errors.wholesalePrice.message}
                    </p>
                  )}
                </div> */}
              </div>

              {/* Price Tiers */}
              {/* <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Escalas de Precio</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPriceTier}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Escala
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Cantidad Mínima</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register(`priceTiers.${index}.minQuantity`, {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.priceTiers?.[index]?.minQuantity
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors.priceTiers?.[index]?.minQuantity && (
                        <p className="text-xs text-red-500">
                          {errors.priceTiers[index]?.minQuantity?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Precio</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...register(`priceTiers.${index}.price`, {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.priceTiers?.[index]?.price
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {errors.priceTiers?.[index]?.price && (
                        <p className="text-xs text-red-500">
                          {errors.priceTiers[index]?.price?.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div> */}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="w-5 h-5" />
                Inventario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stock Actual */}
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Actual *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    {...register("stock", { valueAsNumber: true })}
                    className={errors.stock ? "border-red-500" : ""}
                  />
                  {errors.stock && (
                    <p className="text-sm text-red-500">
                      {errors.stock.message}
                    </p>
                  )}
                </div>

                {/* Stock Mínimo */}
                <div className="space-y-2">
                  <Label htmlFor="minStock">Stock Mínimo *</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min={0}
                    {...register("minStock", { valueAsNumber: true })}
                    className={errors.minStock ? "border-red-500" : ""}
                  />
                  {errors.minStock && (
                    <p className="text-sm text-red-500">
                      {errors.minStock.message}
                    </p>
                  )}
                </div>

                {/* Stock Máximo */}
                <div className="space-y-2">
                  <Label htmlFor="maxStock">Stock Máximo</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    min={0}
                    {...register("maxStock", { valueAsNumber: true })}
                    className={errors.maxStock ? "border-red-500" : ""}
                  />
                  {errors.maxStock && (
                    <p className="text-sm text-red-500">
                      {errors.maxStock.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ubicación */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Ubicación
                  </Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Ej: Almacén A, Estante 3"
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && (
                    <p className="text-sm text-red-500">
                      {errors.location.message}
                    </p>
                  )}
                </div>

                {/* Código de Barras */}
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="flex items-center gap-2">
                    <Barcode className="w-4 h-4" />
                    Código de Barras
                  </Label>
                  <Input
                    id="barcode"
                    {...register("barcode")}
                    className={errors.barcode ? "border-red-500" : ""}
                  />
                  {errors.barcode && (
                    <p className="text-sm text-red-500">
                      {errors.barcode.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Producto Activo</span>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {isEditMode && currentProduct && (
                <>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Estado de Stock
                      </span>
                      {isLowStock ? (
                        <Badge variant="destructive">Stock Bajo</Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          Normal
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-center py-4">
                      {watchedStock}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        unidades
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Card - Solo en modo edición */}
          {isEditMode && currentProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Creado el</span>
                  <span>
                    {new Date(currentProduct.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última actualización</span>
                  <span>
                    {new Date(currentProduct.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor en inventario</span>
                  <span className="font-medium">
                    {formatCurrency(
                      currentProduct.stock * currentProduct.unitPrice,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
}
