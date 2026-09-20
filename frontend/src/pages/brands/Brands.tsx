import { Pagination } from "@/components/Pagination";
import { ExportExcelButton } from "@/components/export/ExportExcelButton";
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
import { Input } from "@/components/ui/input";
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
import { formatDate } from "@/lib/utils";
import { brandService } from "@/services/brand.service";
import { useAuthStore } from "@/stores/auth.store";
import { useBrandStore } from "@/stores/brand.store";
import type { Brand } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
});

type BrandFormData = z.infer<typeof brandSchema>;

export function Brands() {
  const {
    brands,
    pagination,
    isLoading,
    error,
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    clearError,
  } = useBrandStore();

  useStoreErrorToast(error, clearError);

  const { user } = useAuthStore();
  // El backend exige admin/manager para crear, editar, eliminar y exportar.
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const confirm = useConfirm();

  useEffect(() => {
    fetchBrands({ search: debouncedSearch });
  }, [debouncedSearch, fetchBrands]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar marca",
      description:
        "¿Estás seguro de eliminar esta marca? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteBrand(id);
    } catch {
      // El store ya publicó el error para el toast.
    }
  };

  const rowActions = (brand: Brand, className?: string) => (
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
        <DropdownMenuItem onClick={() => setEditingBrand(brand)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDelete(brand._id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="text-gray-500">
            Gestiona las marcas del catálogo de pantallas
          </p>
        </div>
        {canManage && (
          <div className="flex flex-wrap items-center gap-3">
            <ExportExcelButton
              onExport={brandService.exportToExcel}
              disabled={pagination.total === 0}
              successMessage="Excel de marcas generado"
            />
            <ResponsiveDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              trigger={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Marca
                </Button>
              }
              title="Crear Nueva Marca"
            >
              <BrandForm
                onSubmit={async (data) => {
                  await createBrand(data);
                  setIsCreateDialogOpen(false);
                }}
              />
            </ResponsiveDialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* Mobile: card list */}
          <div className="space-y-3 p-4 md:hidden">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))
            ) : brands.length === 0 ? (
              <div className="py-8 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron marcas</p>
              </div>
            ) : (
              brands.map((brand) => (
                <article
                  key={brand._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {brand.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Creada el {formatDate(brand.createdAt)}
                      </p>
                    </div>
                    {canManage && rowActions(brand, "h-11 w-11")}
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron marcas</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand) => (
                    <TableRow key={brand._id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell>{formatDate(brand.createdAt)}</TableCell>
                      <TableCell>{canManage ? rowActions(brand) : null}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(page) =>
              fetchBrands({ page, limit: pagination.limit, search: debouncedSearch })
            }
            onLimitChange={(limit) =>
              fetchBrands({ limit, page: 1, search: debouncedSearch })
            }
          />
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={!!editingBrand}
        onOpenChange={() => setEditingBrand(null)}
        title="Editar Marca"
      >
        {editingBrand && (
          <BrandForm
            initialData={editingBrand}
            onSubmit={async (data) => {
              await updateBrand(editingBrand._id, data);
              setEditingBrand(null);
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}

interface BrandFormProps {
  initialData?: Partial<BrandFormData>;
  onSubmit: (data: BrandFormData) => Promise<void>;
}

function BrandForm({ initialData, onSubmit }: BrandFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: initialData?.name ?? "" },
  });

  const handleSubmit = async (data: BrandFormData) => {
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre *</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Samsung, Xiaomi, Apple" {...field} />
              </FormControl>
              <FormMessage />
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
