import { useState, useEffect } from "react";
import { useSupplierStore } from "@/stores/supplier.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Truck,
  Mail,
  Phone,
} from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { useDebounce } from "@/hooks/useDebounce";
import { useStoreErrorToast } from "@/hooks/useStoreErrorToast";
import { useAuthStore } from "@/stores/auth.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CircleHelp, Loader2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { suppliersOverviewGuide } from "@/lib/tour/guides/suppliers.guides";
import { useTourRunner } from "@/lib/tour/useTourRunner";

const supplierSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  contactName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export function Suppliers() {
  const {
    suppliers,
    pagination,
    isLoading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    clearError,
  } = useSupplierStore();

  useStoreErrorToast(error, clearError);
  const { startTour } = useTourRunner();

  const { user } = useAuthStore();
  // El backend ya exige admin/manager para crear, editar y eliminar
  // proveedores; antes el frontend mostraba estas acciones a cualquier rol
  // autenticado (ej. Cashier), que luego recibía un 403 al intentarlo.
  const canManage = user?.role === "admin" || user?.role === "manager";

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);
  const confirm = useConfirm();

  useEffect(() => {
    fetchSuppliers({ search: debouncedSearch });
  }, [debouncedSearch, fetchSuppliers]);

  const onPageChange = (page: number) => {
    fetchSuppliers({ page });
  };

  // Nuevo handler para cambiar el límite
  const handleLimitChange = (limit: number) => {
    fetchSuppliers({ limit, page: 1 });
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar proveedor",
      description: "¿Estás seguro de eliminar este proveedor? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
    });
    if (!confirmed) return;
    await deleteSupplier(id);
  };

  return (
    <div className="space-y-6">
      <div
        data-tour="suppliers.page-title"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
            <button
              type="button"
              onClick={() => startTour(suppliersOverviewGuide)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Ver recorrido de esta pantalla"
            >
              <CircleHelp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-500">Gestiona tus proveedores</p>
        </div>
        {canManage && (
          <ResponsiveDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            trigger={
              <Button data-tour="suppliers.create-button">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proveedor
              </Button>
            }
            title="Crear Nuevo Proveedor"
            contentClassName="max-w-lg"
          >
            <SupplierForm
              onSubmit={async (data) => {
                await createSupplier(data);
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
              data-tour="suppliers.search-input"
              placeholder="Buscar proveedores..."
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
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))
            ) : suppliers.length === 0 ? (
              <div className="py-8 text-center">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron proveedores</p>
              </div>
            ) : (
              suppliers.map((supplier) => (
                <article
                  key={supplier._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {supplier.name}
                      </h3>
                      {supplier.taxId && (
                        <p className="text-xs text-gray-500">RUC: {supplier.taxId}</p>
                      )}
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        {supplier.contactName && <p>{supplier.contactName}</p>}
                        {supplier.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            data-tour="suppliers.row-actions-entry"
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
                            onClick={() => setEditingSupplier(supplier)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(supplier._id)}
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
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
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
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No se encontraron proveedores
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {supplier.name}
                          </p>
                          {supplier.taxId && (
                            <p className="text-sm text-gray-500">
                              RUC: {supplier.taxId}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {supplier.contactName && (
                            <p className="text-sm">{supplier.contactName}</p>
                          )}
                          {supplier.email && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.phone ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {supplier.phone}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                data-tour="suppliers.row-actions-entry"
                                variant="ghost"
                                size="icon"
                                aria-label="Más opciones"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingSupplier(supplier)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(supplier._id)}
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
        open={!!editingSupplier}
        onOpenChange={() => setEditingSupplier(null)}
        title="Editar Proveedor"
        contentClassName="max-w-lg"
      >
        {editingSupplier && (
          <SupplierForm
            initialData={editingSupplier}
            onSubmit={async (data) => {
              await updateSupplier(editingSupplier._id, data);
              setEditingSupplier(null);
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}

function SupplierForm({
  initialData,
  onSubmit,
}: {
  initialData?: Partial<SupplierFormData>;
  onSubmit: (data: SupplierFormData) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initialData?.name || "",
      contactName: initialData?.contactName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      taxId: initialData?.taxId || "",
    },
  });

  const handleSubmit = async (data: SupplierFormData) => {
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input data-tour="suppliers.form.name-input" placeholder="Nombre del proveedor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Persona de Contacto</FormLabel>
                <FormControl>
                  <Input data-tour="suppliers.form.contact-input" placeholder="Nombre del contacto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    data-tour="suppliers.form.email-input"
                    type="email"
                    placeholder="proveedor@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input data-tour="suppliers.form.phone-input" placeholder="+1 234 567 890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RUC/NIT</FormLabel>
              <FormControl>
                <Input
                  placeholder="Número de identificación fiscal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Dirección del proveedor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t bg-white pt-4">
          <Button
            data-tour="suppliers.form.submit-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
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
