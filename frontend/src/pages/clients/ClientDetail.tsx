import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useClientStore } from "@/stores/client.store";
import { useOrderStore } from "@/stores/order.store";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Pagination } from "@/components/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MovementType, OrderStatus } from "@/types";
import {
  ArrowLeft,
  Save,
  Loader2,
  Mail,
  Phone,
  ShoppingBag,
  Wallet,
  Receipt,
} from "lucide-react";

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

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    [OrderStatus.PENDING]: "bg-yellow-50 text-yellow-700 border-yellow-200",
    [OrderStatus.COMPLETED]: "bg-green-50 text-green-700 border-green-200",
    [OrderStatus.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    [OrderStatus.PENDING]: "Pendiente",
    [OrderStatus.COMPLETED]: "Completada",
    [OrderStatus.CANCELLED]: "Cancelada",
  };
  return (
    <Badge variant="outline" className={styles[status] || ""}>
      {labels[status] || status}
    </Badge>
  );
};

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = user?.role === "admin" || user?.role === "manager";

  const {
    currentClient,
    currentClientStats,
    isLoading,
    fetchClientById,
    fetchClientStats,
    updateClient,
    clearCurrentClient,
  } = useClientStore();

  const { orders, pagination, isLoading: isLoadingOrders, fetchOrders } =
    useOrderStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (id) {
      fetchClientById(id);
      fetchClientStats(id);
      fetchOrders({ client: id, type: MovementType.SALE, page: 1 });
    }
    return () => clearCurrentClient();
  }, [id, fetchClientById, fetchClientStats, fetchOrders, clearCurrentClient]);

  useEffect(() => {
    if (currentClient) {
      form.reset({
        name: currentClient.name,
        email: currentClient.email || "",
        phone: currentClient.phone || "",
      });
    }
  }, [currentClient, form]);

  const handlePageChange = (page: number) => {
    if (id) fetchOrders({ client: id, type: MovementType.SALE, page });
  };

  const handleSave = async (data: ClientFormData) => {
    if (!id) return;
    try {
      await updateClient(id, {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      toast.success("Cliente actualizado exitosamente");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al actualizar el cliente",
      );
    }
  };

  const handleToggleActive = async (nextValue: boolean) => {
    if (!id) return;
    setIsTogglingActive(true);
    try {
      await updateClient(id, { isActive: nextValue });
      toast.success(
        nextValue ? "Cliente activado" : "Cliente desactivado",
      );
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al cambiar el estado",
      );
    } finally {
      setIsTogglingActive(false);
    }
  };

  if (isLoading || !currentClient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentClient.name}
            </h1>
            <Badge
              variant={currentClient.isActive ? "default" : "secondary"}
              className={
                currentClient.isActive
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {currentClient.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="text-gray-500">Cliente desde {formatDate(currentClient.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Compras completadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentClientStats?.totalOrders ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total gastado</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentClientStats?.totalSpent ?? 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Historial de compras
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile: card list */}
              <div className="space-y-3 p-4 md:hidden">
                {isLoadingOrders ? (
                  [...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                  ))
                ) : orders.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    Este cliente todavía no tiene compras registradas
                  </p>
                ) : (
                  orders.map((order) => (
                    <article
                      key={order._id}
                      className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                      onClick={() => navigate(`/orders/${order._id}`)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <code className="text-sm font-semibold">
                            {order.orderNumber}
                          </code>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="mt-3 text-right text-lg font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                    </article>
                  ))
                )}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingOrders ? (
                      [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={4}>
                            <Skeleton className="h-10" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          Este cliente todavía no tiene compras registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow
                          key={order._id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          <TableCell>
                            <code className="text-sm font-semibold">
                              {order.orderNumber}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="px-4">
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Información</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSave)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <Input type="email" {...field} />
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          form.reset({
                            name: currentClient.name,
                            email: currentClient.email || "",
                            phone: currentClient.phone || "",
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {currentClient.email || "Sin email"}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {currentClient.phone || "Sin teléfono"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Cliente activo
                    </p>
                    <p className="text-xs text-gray-500">
                      Un cliente inactivo no se puede seleccionar en nuevas
                      ventas.
                    </p>
                  </div>
                  <Switch
                    checked={currentClient.isActive}
                    disabled={isTogglingActive}
                    onCheckedChange={handleToggleActive}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
