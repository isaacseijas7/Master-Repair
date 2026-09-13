import { Pagination } from "@/components/Pagination";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useStoreErrorToast } from "@/hooks/useStoreErrorToast";
import { useAuthStore } from "@/stores/auth.store";
import { useCategoryStore } from "@/stores/category.store";
import { categoriesOverviewGuide } from "@/lib/tour/guides/categories.guides";
import { useTourRunner } from "@/lib/tour/useTourRunner";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleHelp,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// ==========================================
// SCHEMA Y TIPO EXPLÍCITO
// ==========================================

const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  color: z.string().min(1, "El color es requerido"),
});

// Tipo explícito en lugar de inferir de Zod
type CategoryFormData = {
  name: string;
  description?: string;
  color: string;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function Categories() {
  const {
    categories,
    pagination,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  } = useCategoryStore();

  useStoreErrorToast(error, clearError);
  const { startTour } = useTourRunner();

  const { user } = useAuthStore();
  // El backend ya exige admin/manager para crear, editar y eliminar
  // categorías; antes el frontend mostraba estas acciones a cualquier rol
  // autenticado (ej. Cashier), que luego recibía un 403 al intentarlo.
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchCategories({ search: debouncedSearch });
  }, [debouncedSearch, fetchCategories]);

  const onPageChange = (page: number) => {
    fetchCategories({ page });
  };

  // Nuevo handler para cambiar el límite
  const handleLimitChange = (limit: number) => {
    fetchCategories({ limit, page: 1 });
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      <div
        data-tour="categories.page-title"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
            <button
              type="button"
              onClick={() => startTour(categoriesOverviewGuide)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Ver recorrido de esta pantalla"
            >
              <CircleHelp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-500">Gestiona las categorías de productos</p>
        </div>
        {canManage && (
          <ResponsiveDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            trigger={
              <Button data-tour="categories.create-button">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            }
            title="Crear Nueva Categoría"
          >
            <CategoryForm
              onSubmit={async (data) => {
                await createCategory(data);
                setIsCreateDialogOpen(false);
              }}
            />
          </ResponsiveDialog>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              data-tour="categories.search-input"
              placeholder="Buscar categorías..."
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
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))
            ) : categories.length === 0 ? (
              <div className="py-8 text-center">
                <Tags className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron categorías</p>
              </div>
            ) : (
              categories.map((category) => (
                <article
                  key={category._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 shrink-0 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="truncate text-base font-semibold text-gray-900">
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className="mt-1 text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            data-tour="categories.row-actions-entry"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11"
                            aria-label="Más opciones"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(category._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
                  <TableHead>Descripción</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Tags className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No se encontraron categorías
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-500">
                            {category.color}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                data-tour="categories.row-actions-entry"
                                variant="ghost"
                                size="icon"
                                aria-label="Más opciones"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingCategory(category)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(category._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={handleLimitChange}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ResponsiveDialog
        open={!!editingCategory}
        onOpenChange={() => setEditingCategory(null)}
        title="Editar Categoría"
      >
        {editingCategory && (
          <CategoryForm
            initialData={editingCategory}
            onSubmit={async (data) => {
              await updateCategory(editingCategory._id, data);
              setEditingCategory(null);
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}

// ==========================================
// COMPONENTE FORMULARIO
// ==========================================

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

function CategoryForm({ initialData, onSubmit }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      color: initialData?.color ?? "#3B82F6",
    },
  });

  const handleSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
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
                <Input data-tour="categories.form.name-input" placeholder="Nombre de la categoría" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  data-tour="categories.form.description-input"
                  placeholder="Descripción opcional"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color *</FormLabel>
              <FormControl>
                <div data-tour="categories.form.color-input" className="flex items-center gap-2">
                  <input
                    type="color"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button data-tour="categories.form.submit-button" type="submit" disabled={isSubmitting}>
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
