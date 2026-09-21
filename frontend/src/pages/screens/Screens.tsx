import { Pagination } from "@/components/Pagination";
import { ExportScreensDialog } from "@/components/export/ExportScreensDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/useConfirm";
import { useDebounce } from "@/hooks/useDebounce";
import { useStoreErrorToast } from "@/hooks/useStoreErrorToast";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useBrandStore } from "@/stores/brand.store";
import { useScreenStore } from "@/stores/screen.store";
import type { Brand, Screen } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, type Control } from "react-hook-form";
import { z } from "zod";

// Los precios se capturan como texto en el input numérico y se convierten a
// número al enviar; así el formulario conserva exactamente lo que escribe
// el usuario (ej. "10.50").
const isValidPrice = (v: string) =>
  Number.isFinite(Number(v)) && Number(v) > 0 && /^\d+(\.\d{1,2})?$/.test(v);

const optionalPrice = z
  .string()
  .refine((v) => v === "" || isValidPrice(v), {
    message: "Debe ser mayor a 0, con máximo 2 decimales",
  });

const screenSchema = z
  .object({
    brandId: z.string().min(1, "Selecciona una marca"),
    screenModel: z
      .string()
      .trim()
      .min(1, "El modelo es requerido")
      .max(150, "Máximo 150 caracteres"),
    purchasePrice: optionalPrice,
    unitSalePrice: optionalPrice,
    salePrice: optionalPrice,
    isMechanic: z.boolean(),
  })
  // Al menos uno de los dos precios de venta es obligatorio.
  .superRefine((data, ctx) => {
    if (data.unitSalePrice === "" && data.salePrice === "") {
      const message = "Ingresa al menos el precio unitario o el precio al por mayor";
      ctx.addIssue({ code: "custom", path: ["unitSalePrice"], message });
      ctx.addIssue({ code: "custom", path: ["salePrice"], message });
    }
  });

type ScreenFormData = z.infer<typeof screenSchema>;

const priceToString = (value?: number | null) =>
  typeof value === "number" ? String(value) : "";

const formatPrice = (value?: number | null) =>
  typeof value === "number" ? formatCurrency(value) : "-";

const getBrandName = (brand: Screen["brandId"]) =>
  typeof brand === "string" ? "-" : brand?.name ?? "-";

const getBrandId = (brand: Screen["brandId"]) =>
  typeof brand === "string" ? brand : brand?._id ?? "";

export function Screens() {
  const {
    screens,
    pagination,
    isLoading,
    error,
    fetchScreens,
    createScreen,
    updateScreen,
    deleteScreen,
    clearError,
  } = useScreenStore();
  const { allBrands, fetchAllBrands } = useBrandStore();

  useStoreErrorToast(error, clearError);

  const { user } = useAuthStore();
  // El backend exige admin/manager para crear, editar, eliminar y exportar.
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState<string | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const confirm = useConfirm();

  useEffect(() => {
    fetchAllBrands();
  }, [fetchAllBrands]);

  useEffect(() => {
    fetchScreens({ search: debouncedSearch, brandId: brandFilter });
  }, [debouncedSearch, brandFilter, fetchScreens]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar pantalla",
      description:
        "¿Estás seguro de eliminar esta pantalla? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteScreen(id);
    } catch {
      // El store ya publicó el error para el toast.
    }
  };

  // Los precios opcionales en blanco se envían como null (vacían el valor).
  const toInput = (data: ScreenFormData) => ({
    brandId: data.brandId,
    screenModel: data.screenModel,
    salePrice: data.salePrice ? Number(data.salePrice) : null,
    unitSalePrice: data.unitSalePrice ? Number(data.unitSalePrice) : null,
    purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : null,
    isMechanic: data.isMechanic,
  });

  // Marca, modelo, tipo, mayor, unitario, [compra] y acciones.
  const columnCount = canManage ? 7 : 6;

  const rowActions = (screen: Screen, className?: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Más opciones"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditingScreen(screen)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDelete(screen._id)}
          className="text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pantallas</h1>
          <p className="text-gray-500">
            Gestiona el catálogo de pantallas y sus precios
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <ExportScreensDialog currentBrandId={brandFilter} />
            <ResponsiveDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              trigger={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Pantalla
                </Button>
              }
              title="Crear Nueva Pantalla"
            >
              <ScreenForm
                brands={allBrands}
                onSubmit={async (data) => {
                  await createScreen(toInput(data));
                  setIsCreateDialogOpen(false);
                }}
              />
            </ResponsiveDialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={brandFilter ?? "all"}
            onValueChange={(value) =>
              setBrandFilter(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas las marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {allBrands.map((brand) => (
                <SelectItem key={brand._id} value={brand._id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* Mobile: card list */}
          <div className="space-y-3 p-4 md:hidden">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))
            ) : screens.length === 0 ? (
              <div className="py-8 text-center">
                <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron pantallas</p>
              </div>
            ) : (
              screens.map((screen) => (
                <article
                  key={screen._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        {getBrandName(screen.brandId)}
                      </p>
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {screen.screenModel}
                      </h3>
                      {screen.isMechanic && <MechanicBadge className="mt-1" />}
                      <dl className="mt-2 space-y-0.5 text-sm text-gray-700">
                        {canManage && (
                          <div className="flex gap-2">
                            <dt className="text-gray-500">Compra:</dt>
                            <dd className="font-medium">{formatPrice(screen.purchasePrice)}</dd>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <dt className="text-gray-500">Unitario:</dt>
                          <dd className="font-medium">{formatPrice(screen.unitSalePrice)}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-gray-500">Mayor:</dt>
                          <dd className="font-medium">{formatPrice(screen.salePrice)}</dd>
                        </div>
                      </dl>
                    </div>
                    {canManage && rowActions(screen, "h-11 w-11")}
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Precio de compra (USD)</TableHead>
                  )}
                  <TableHead className="text-right">Precio unitario (USD)</TableHead>
                  <TableHead className="text-right">Precio al por mayor (USD)</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columnCount}>
                        <Skeleton className="h-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : screens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="text-center py-8">
                      <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron pantallas</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  screens.map((screen) => (
                    <TableRow key={screen._id}>
                      <TableCell>{getBrandName(screen.brandId)}</TableCell>
                      <TableCell className="font-medium">
                        {screen.screenModel}
                      </TableCell>
                      <TableCell>
                        {screen.isMechanic ? (
                          <MechanicBadge />
                        ) : (
                          <span className="text-gray-500">Regular</span>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right tabular-nums">
                          {formatPrice(screen.purchasePrice)}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(screen.unitSalePrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(screen.salePrice)}
                      </TableCell>
                      <TableCell>{canManage ? rowActions(screen) : null}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) =>
              fetchScreens({
                page,
                limit: pagination.limit,
                search: debouncedSearch,
                brandId: brandFilter,
              })
            }
            onLimitChange={(limit) =>
              fetchScreens({
                limit,
                page: 1,
                search: debouncedSearch,
                brandId: brandFilter,
              })
            }
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={!!editingScreen}
        onOpenChange={() => setEditingScreen(null)}
        title="Editar Pantalla"
      >
        {editingScreen && (
          <ScreenForm
            brands={allBrands}
            initialData={{
              brandId: getBrandId(editingScreen.brandId),
              screenModel: editingScreen.screenModel,
              salePrice: priceToString(editingScreen.salePrice),
              unitSalePrice: priceToString(editingScreen.unitSalePrice),
              purchasePrice: priceToString(editingScreen.purchasePrice),
              isMechanic: editingScreen.isMechanic ?? false,
            }}
            onSubmit={async (data) => {
              await updateScreen(editingScreen._id, toInput(data));
              setEditingScreen(null);
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}

interface ScreenFormProps {
  brands: Brand[];
  initialData?: Partial<ScreenFormData>;
  onSubmit: (data: ScreenFormData) => Promise<void>;
}

function ScreenForm({ brands, initialData, onSubmit }: ScreenFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScreenFormData>({
    resolver: zodResolver(screenSchema),
    defaultValues: {
      brandId: initialData?.brandId ?? "",
      screenModel: initialData?.screenModel ?? "",
      salePrice: initialData?.salePrice ?? "",
      unitSalePrice: initialData?.unitSalePrice ?? "",
      purchasePrice: initialData?.purchasePrice ?? "",
      isMechanic: initialData?.isMechanic ?? false,
    },
  });

  const handleSubmit = async (data: ScreenFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch {
      // El store ya publicó el error para el toast; el diálogo queda abierto.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="brandId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una marca" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand._id} value={brand._id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brands.length === 0 && (
                <p className="text-xs text-gray-500">
                  Aún no hay marcas. Créalas primero en Catálogo de Pantallas →
                  Marcas.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="screenModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Galaxy S24, Redmi Note 13" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <PriceField
          control={form.control}
          name="purchasePrice"
          label="Precio de compra al proveedor (USD)"
        />
        <PriceField
          control={form.control}
          name="unitSalePrice"
          label="Precio de venta unitario (USD)"
        />
        <PriceField
          control={form.control}
          name="salePrice"
          label="Precio de venta al por mayor (USD)"
        />
        <p className="-mt-2 text-xs text-gray-500">
          Ingresa al menos uno: el precio unitario o el precio al por mayor.
        </p>
        <FormField
          control={form.control}
          name="isMechanic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 rounded-lg border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">Pantalla de mecánico</FormLabel>
                <p className="text-xs text-gray-500">
                  Márcala si proviene del proveedor mecánico. Permite exportar
                  el catálogo por separado.
                </p>
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function MechanicBadge({ className }: { className?: string }) {
  return (
    <Badge variant="secondary" className={className}>
      Mecánico
    </Badge>
  );
}

interface PriceFieldProps {
  control: Control<ScreenFormData>;
  name: "salePrice" | "unitSalePrice" | "purchasePrice";
  label: string;
}

function PriceField({ control, name, label }: PriceFieldProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                $
              </span>
              <Input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="pl-7 pr-14"
                {...field}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500">
                USD
              </span>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
