import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { isSupplierObject } from "@/helpers/isSupplierObject";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useOrderStore } from "@/stores/order.store";
import { MovementType, OrderStatus, type OrderFilters } from "@/types";
import {
  ArrowLeftRight,
  Banknote,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Tipo para el estado de filtros local
type FilterState = {
  type: OrderFilters["type"];
  status: OrderFilters["status"];
};

export function Orders() {
  const navigate = useNavigate();
  const {
    orders,
    pagination,
    isLoading,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
    pendingCount,
  } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    type: undefined,
    status: undefined,
  });
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const orderFilters: OrderFilters = {
      ...filters,
      search: debouncedSearch,
    };
    fetchOrders(orderFilters);
  }, [debouncedSearch, filters]);

  const handlePageChange = (page: number) => {
    const orderFilters: OrderFilters = {
      ...filters,
      search: debouncedSearch,
      page,
    };
    fetchOrders(orderFilters);
  };

  const handleCompleteOrder = async (id: string) => {
    try {
      await updateOrderStatus(id, OrderStatus.COMPLETED);
      toast.success("Orden completada exitosamente");
    } catch (error) {
      toast.error("Error al completar la orden");
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (confirm("¿Estás seguro de cancelar esta orden?")) {
      try {
        await cancelOrder(id);
        toast.success("Orden cancelada exitosamente");
      } catch (error) {
        toast.error("Error al cancelar la orden");
      }
    }
  };

  // Helper para manejar cambio de tipo con tipo seguro
  const handleTypeChange = (value: string) => {
    const type = value === "all" ? undefined : (value as FilterState["type"]);
    setFilters((prev) => ({ ...prev, type }));
  };

  // Helper para manejar cambio de status con tipo seguro
  const handleStatusChange = (value: string) => {
    const status =
      value === "all" ? undefined : (value as FilterState["status"]);
    setFilters((prev) => ({ ...prev, status }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case MovementType.SALE:
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case MovementType.PURCHASE:
        return <Package className="w-4 h-4 text-purple-500" />;
      case MovementType.RETURN:
        return <ArrowLeftRight className="w-4 h-4 text-orange-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentIcon = (paymentType: string | undefined) => {
    switch (paymentType) {
      case "cash":
        return <Banknote className="w-4 h-4 text-green-500" />;
      case "credit":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getPaymentLabel = (paymentType: string | undefined) => {
    switch (paymentType) {
      case "cash":
        return "Contado";
      case "credit":
        return "Crédito";
      default:
        return null;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Pendiente
          </Badge>
        );
      case OrderStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Completada
          </Badge>
        );
      case OrderStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
          <p className="text-gray-500">
            Gestiona ventas, compras y devoluciones
          </p>
        </div>
        <Button onClick={() => navigate("/orders/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Órdenes Pendientes
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {pendingCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número de orden o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.type || "all"}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value={MovementType.SALE}>Ventas</SelectItem>
                <SelectItem value={MovementType.PURCHASE}>Compras</SelectItem>
                <SelectItem value={MovementType.RETURN}>
                  Devoluciones
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value={OrderStatus.PENDING}>Pendientes</SelectItem>
                <SelectItem value={OrderStatus.COMPLETED}>
                  Completadas
                </SelectItem>
                <SelectItem value={OrderStatus.CANCELLED}>
                  Canceladas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente/Proveedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No se encontraron órdenes</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(order.type)}
                          <code className="text-sm font-semibold text-gray-900">
                            {order.orderNumber}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {getTypeLabel(order.type)}
                          {order.type === MovementType.SALE &&
                            order.paymentType && (
                              <>
                                <div className="flex items-center gap-1.5">
                                  {getPaymentIcon(order.paymentType)}
                                  <span
                                    className={`text-sm font-medium ${
                                      order.paymentType === "cash"
                                        ? "text-green-600"
                                        : "text-blue-600"
                                    }`}
                                  >
                                    {getPaymentLabel(order.paymentType)}
                                  </span>
                                </div>
                              </>
                            )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.customerName ||
                              (isSupplierObject(order.supplier) &&
                                order.supplier?.name) ||
                              "N/A"}
                          </p>
                          {order.customerEmail && (
                            <p className="text-xs text-gray-500">
                              {order.customerEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/orders/${order._id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalle
                            </DropdownMenuItem>
                            {order.status === OrderStatus.PENDING && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleCompleteOrder(order._id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Completar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                de {pagination.total} órdenes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Number(pagination.page) - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Number(pagination.page) + 1)}
                  disabled={!pagination.hasNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
