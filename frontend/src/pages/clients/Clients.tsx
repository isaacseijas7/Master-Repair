import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClientStore } from "@/stores/client.store";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Search, Plus, MoreHorizontal, Eye, Trash2, Users, Mail, Phone } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useStoreErrorToast } from "@/hooks/useStoreErrorToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";

// Mismo patrón que valida el backend: antes no había ninguna validación de
// formato de teléfono, ni aquí ni en el servidor.
const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

const clientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(phoneRegex, "Teléfono inválido")
    .optional()
    .or(z.literal("")),
});

type ClientFormData = z.infer<typeof clientSchema>;

export function Clients() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // Igual que en Categorías/Proveedores: el backend ya exige admin/manager
  // para eliminar; el frontend antes no ocultaba esta acción para roles sin
  // permiso.
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const {
    clients,
    pagination,
    isLoading,
    error,
    fetchClients,
    createClient,
    deleteClient,
    clearError,
  } = useClientStore();

  useStoreErrorToast(error, clearError);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchClients({ search: debouncedSearch });
  }, [debouncedSearch, fetchClients]);

  const onPageChange = (page: number) => {
    fetchClients({ page, search: debouncedSearch });
  };

  const handleLimitChange = (limit: number) => {
    fetchClients({ limit, page: 1, search: debouncedSearch });
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      try {
        await deleteClient(id);
        toast.success("Cliente eliminado");
      } catch {
        // deleteClient ya deja el mensaje en `error` del store; lo muestra
        // useStoreErrorToast. Mostrarlo también aquí duplicaría el toast.
      }
    }
  };

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const handleCreate = async (data: ClientFormData) => {
    try {
      const client = await createClient({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      toast.success("Cliente creado exitosamente");
      setIsCreateDialogOpen(false);
      form.reset();
      navigate(`/clients/${client._id}`);
    } catch {
      // createClient ya deja el mensaje en `error` del store; lo muestra
      // useStoreErrorToast. Mostrarlo también aquí duplicaría el toast.
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">
            Gestiona tus clientes y consulta su historial de compras
          </p>
        </div>
        <ResponsiveDialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) form.reset();
          }}
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          }
          title="Registrar Cliente"
        >
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="cliente@email.com"
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
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
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
        </ResponsiveDialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
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
            ) : clients.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron clientes</p>
              </div>
            ) : (
              clients.map((client) => (
                <article
                  key={client._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  onClick={() => navigate(`/clients/${client._id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        {client.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge
                        variant={client.isActive ? "default" : "secondary"}
                        className={
                          client.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {client.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Más opciones">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/clients/${client._id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver detalle
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(client._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
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
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No se encontraron clientes
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow
                      key={client._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/clients/${client._id}`)}
                    >
                      <TableCell className="font-medium text-gray-900">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm text-gray-600">
                          {client.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {client.phone}
                            </div>
                          )}
                          {!client.email && !client.phone && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={client.isActive ? "default" : "secondary"}
                          className={
                            client.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {client.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Más opciones">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/clients/${client._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(client._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={handleLimitChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
