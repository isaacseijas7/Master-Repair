import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUserStore } from "@/stores/user.store";
import { useAuthStore } from "@/stores/auth.store";
import { useDebounce } from "@/hooks/useDebounce";
import { useStoreErrorToast } from "@/hooks/useStoreErrorToast";
import { UserRole, type User } from "@/types";
import {
  createUserFormSchema,
  updateUserFormSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Pagination } from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CircleHelp,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  UserCog,
} from "lucide-react";
import { usersOverviewGuide } from "@/lib/tour/guides/users.guides";
import { useTourRunner } from "@/lib/tour/useTourRunner";

const ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.MANAGER]: "Gerente",
  [UserRole.CASHIER]: "Cajero",
};

function getRoleBadgeVariant(
  role: string,
): "default" | "destructive" | "secondary" {
  switch (role) {
    case UserRole.ADMIN:
      return "destructive";
    case UserRole.MANAGER:
      return "default";
    default:
      return "secondary";
  }
}

export function Users() {
  const {
    users,
    pagination,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    clearError,
  } = useUserStore();

  useStoreErrorToast(error, clearError);
  const { startTour } = useTourRunner();

  const { user: currentUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(
    undefined,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchUsers({
      search: debouncedSearch,
      role: roleFilter,
      isActive: statusFilter,
    });
  }, [debouncedSearch, roleFilter, statusFilter, fetchUsers]);

  const onPageChange = (page: number) => {
    fetchUsers({ page, search: debouncedSearch, role: roleFilter, isActive: statusFilter });
  };

  const handleLimitChange = (limit: number) => {
    fetchUsers({ limit, page: 1, search: debouncedSearch, role: roleFilter, isActive: statusFilter });
  };

  const handleDelete = async (targetUser: User) => {
    if (targetUser._id === currentUser?._id) return;
    if (confirm(`¿Estás seguro de eliminar al usuario "${targetUser.firstName} ${targetUser.lastName}"?`)) {
      try {
        await deleteUser(targetUser._id);
        toast.success("Usuario eliminado");
      } catch {
        // deleteUser ya deja el mensaje en `error` del store; lo muestra
        // useStoreErrorToast. Mostrarlo también aquí duplicaría el toast.
      }
    }
  };

  return (
    <div className="space-y-6">
      <div
        data-tour="users.page-title"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <button
              type="button"
              onClick={() => startTour(usersOverviewGuide)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Ver recorrido de esta pantalla"
            >
              <CircleHelp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-500">
            Administra las cuentas y los roles del sistema
          </p>
        </div>
        <ResponsiveDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          trigger={
            <Button data-tour="users.create-button">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          }
          title="Crear Nuevo Usuario"
          contentClassName="sm:max-w-lg"
        >
          <UserForm
            onSubmit={async (data) => {
              await createUser(data as CreateUserFormData & { role: string });
              setIsCreateDialogOpen(false);
            }}
          />
        </ResponsiveDialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                data-tour="users.search-input"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) =>
                setRoleFilter(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger data-tour="users.filters-entry" className="w-full sm:w-48">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                <SelectItem value={UserRole.CASHIER}>Cajero</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={
                statusFilter === undefined
                  ? "all"
                  : statusFilter
                    ? "active"
                    : "inactive"
              }
              onValueChange={(value) =>
                setStatusFilter(
                  value === "all" ? undefined : value === "active",
                )
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
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
            ) : users.length === 0 ? (
              <div className="py-8 text-center">
                <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No se encontraron usuarios</p>
              </div>
            ) : (
              users.map((u) => (
                <article
                  key={u._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {u.firstName} {u.lastName}
                        {u._id === currentUser?._id && (
                          <span className="ml-1 text-xs text-gray-400">(Tú)</span>
                        )}
                      </h3>
                      <p className="mt-1 truncate text-sm text-gray-600">{u.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={getRoleBadgeVariant(u.role)}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            data-tour="users.row-actions-entry"
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11"
                            aria-label="Más opciones"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(u)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {u._id !== currentUser?._id && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(u)}
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
                  <div className="mt-3">
                    <Badge
                      variant={u.isActive ? "default" : "secondary"}
                      className={
                        u.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {u.isActive ? "Activo" : "Inactivo"}
                    </Badge>
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
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron usuarios</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                        {u._id === currentUser?._id && (
                          <span className="ml-1 text-xs text-gray-400">(Tú)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.isActive ? "default" : "secondary"}
                          className={
                            u.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {u.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              data-tour="users.row-actions-entry"
                              variant="ghost"
                              size="icon"
                              aria-label="Más opciones"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingUser(u)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {u._id !== currentUser?._id && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(u)}
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

      {/* Edit Dialog */}
      <ResponsiveDialog
        open={!!editingUser}
        onOpenChange={() => setEditingUser(null)}
        title="Editar Usuario"
        contentClassName="sm:max-w-lg"
      >
        {editingUser && (
          <UserForm
            initialData={editingUser}
            isSelf={editingUser._id === currentUser?._id}
            onSubmit={async (data) => {
              await updateUser(editingUser._id, data as UpdateUserFormData);
              setEditingUser(null);
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}

// ==========================================
// COMPONENTE FORMULARIO (crear y editar)
// ==========================================

interface UserFormProps {
  initialData?: User;
  isSelf?: boolean;
  onSubmit: (data: CreateUserFormData | UpdateUserFormData) => Promise<void>;
}

function UserForm({ initialData, isSelf, onSubmit }: UserFormProps) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(
      isEditing ? updateUserFormSchema : createUserFormSchema,
    ) as any,
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      email: initialData?.email ?? "",
      password: "",
      role: initialData?.role ?? UserRole.CASHIER,
      isActive: initialData?.isActive ?? true,
    },
  });

  const handleSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const { password: _password, ...rest } = data;
        await onSubmit(rest);
      } else {
        await onSubmit(data);
      }
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input data-tour="users.form.first-name-input" placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido *</FormLabel>
                <FormControl>
                  <Input placeholder="Apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input data-tour="users.form.email-input" type="email" placeholder="usuario@masterrepair.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña *</FormLabel>
                <FormControl>
                  <Input data-tour="users.form.password-input" type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <p className="text-xs text-gray-500">
                  Mínimo 6 caracteres, con mayúscula, minúscula y número.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol *</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSelf}
              >
                <FormControl>
                  <SelectTrigger data-tour="users.form.role-select" className="w-full">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                  <SelectItem value={UserRole.CASHIER}>Cajero</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && (
                <p className="text-xs text-amber-600">
                  No puede cambiar el rol de su propia cuenta desde aquí.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Usuario activo</Label>
                <p className="text-xs text-gray-500">
                  Un usuario inactivo no puede iniciar sesión.
                </p>
              </div>
              <FormControl>
                <Switch
                  data-tour="users.form.active-switch"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSelf}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {isSelf && (
          <p className="text-xs text-amber-600">
            No puede desactivar su propia cuenta desde aquí.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button data-tour="users.form.submit-button" type="submit" disabled={isSubmitting}>
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
