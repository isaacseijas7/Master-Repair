import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isProductObject } from "@/helpers/isProductObject";
import { isSupplierObject } from "@/helpers/isSupplierObject";
import { isUserObject } from "@/helpers/isUserObject";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useOrderStore } from "@/stores/order.store";
import { MovementType, OrderStatus } from "@/types";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  Mail,
  Package,
  Phone,
  Printer, XCircle,
  Banknote,
  CreditCard,
  MessageSquare,
  Edit,
  MoreVertical, User,
  Building2
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentOrder,
    fetchOrderById,
    updateOrderStatus,
    cancelOrder,
    isLoading,
  } = useOrderStore();

  useEffect(() => {
    if (id) {
      fetchOrderById(id);
    }
  }, [id, fetchOrderById]);

  const handleCompleteOrder = async () => {
    if (!id) return;
    try {
      await updateOrderStatus(id, OrderStatus.COMPLETED);
      toast.success("Orden completada exitosamente");
      fetchOrderById(id);
    } catch (error) {
      toast.error("Error al completar la orden");
    }
  };

  const handleCancelOrder = async () => {
    if (!id) return;
    if (confirm("¿Estás seguro de cancelar esta orden?")) {
      try {
        await cancelOrder(id);
        toast.success("Orden cancelada exitosamente");
        fetchOrderById(id);
      } catch (error) {
        toast.error("Error al cancelar la orden");
      }
    }
  };

  const handleCopyWhatsAppMessage = () => {
    if (!currentOrder) return;

    let message = `Hola, me gustaría solicitar la compra de los siguientes productos:\n\n`;

    currentOrder.items.forEach((item) => {
      const productName = isProductObject(item.product)
        ? item.product.name
        : "Producto desconocido";
      message += `• *${productName}*\n  Cantidad: ${item.quantity}\n\n`;
    });

    if (currentOrder.notes) {
      message += `*Nota:* ${currentOrder.notes}\n`;
    }

    navigator.clipboard
      .writeText(message.trim())
      .then(() => {
        toast.success("Mensaje copiado para WhatsApp");
      })
      .catch(() => {
        toast.error("Error al copiar el mensaje");
      });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      [OrderStatus.PENDING]: "bg-yellow-50 text-yellow-700 border-yellow-200",
      [OrderStatus.COMPLETED]: "bg-green-50 text-green-700 border-green-200",
      [OrderStatus.CANCELLED]: "bg-red-50 text-red-700 border-red-200",
    };

    const labels = {
      [OrderStatus.PENDING]: "Pendiente",
      [OrderStatus.COMPLETED]: "Completada",
      [OrderStatus.CANCELLED]: "Cancelada",
    };

    return (
      <Badge
        variant="outline"
        className={`${styles[status as keyof typeof styles] || ""} text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1`}
      >
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentType: string | undefined) => {
    if (!paymentType) return null;

    const isCash = paymentType === "cash";
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
          isCash
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-blue-50 text-blue-700 border-blue-200"
        }`}
      >
        {isCash ? (
          <Banknote className="w-3.5 h-3.5" />
        ) : (
          <CreditCard className="w-3.5 h-3.5" />
        )}
        {isCash ? "Contado" : "Crédito"}
      </div>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      [MovementType.SALE]: "Venta",
      [MovementType.PURCHASE]: "Compra",
      [MovementType.RETURN]: "Devolución",
      [MovementType.ADJUSTMENT]: "Ajuste",
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case MovementType.SALE:
        return <DollarSign className="w-4 h-4" />;
      case MovementType.PURCHASE:
        return <Building2 className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <Skeleton className="h-12 w-full sm:w-64" />
        <div className="space-y-4">
          <Skeleton className="h-48 sm:h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const creatorName = isUserObject(currentOrder.createdBy)
    ? `${currentOrder.createdBy.firstName} ${currentOrder.createdBy.lastName}`
    : "Usuario desconocido";

  const isPending = currentOrder.status === OrderStatus.PENDING;
  const isPurchase = currentOrder.type === MovementType.PURCHASE;

  const MobileItemsList = () => (
    <div className="space-y-3 sm:hidden">
      {currentOrder.items.map((item, index) => {
        const productName = isProductObject(item.product)
          ? item.product.name
          : "Producto desconocido";
        const productSku = isProductObject(item.product)
          ? item.product.sku
          : "-";

        return (
          <div key={index} className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 pr-2">
                <h4 className="font-medium text-gray-900 text-sm leading-tight">
                  {productName}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  SKU: {productSku}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600 border-t border-gray-200 pt-2">
              <span>
                {item.quantity} x {formatCurrency(item.unitPrice)}
              </span>
              <span className="font-medium">
                Total: {formatCurrency(item.totalPrice)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 sm:pb-0">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={() => navigate("/orders")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {currentOrder.orderNumber}
                </h1>
                {getStatusBadge(currentOrder.status)}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                  {getTypeIcon(currentOrder.type)}
                  {getTypeLabel(currentOrder.type)}
                </span>
                {currentOrder.type === MovementType.SALE &&
                  currentOrder.paymentType && (
                    <>
                      <span className="text-gray-300">•</span>
                      {getPaymentBadge(currentOrder.paymentType)}
                    </>
                  )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:hidden"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:hidden"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </DropdownMenuItem>

                {isPending && (
                  <>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/orders/${currentOrder._id}/edit`)
                      }
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Orden
                    </DropdownMenuItem>

                    {isPurchase && (
                      <DropdownMenuItem onClick={handleCopyWhatsAppMessage}>
                        <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                        Copiar para WhatsApp
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleCompleteOrder}
                      className="text-green-600 focus:text-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completar
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleCancelOrder}
                      className="text-red-600 focus:text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-9"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>

              {isPending && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/orders/${currentOrder._id}/edit`)}
                    className="h-9"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>

                  {isPurchase && (
                    <Button
                      variant="outline"
                      onClick={handleCopyWhatsAppMessage}
                      className="h-9 border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}

                  <Button
                    onClick={handleCompleteOrder}
                    className="h-9 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    className="h-9"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Productos ({currentOrder.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6">
                <MobileItemsList />

                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[45%]">Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentOrder.items.map((item, index) => {
                        const productName = isProductObject(item.product)
                          ? item.product.name
                          : "Producto desconocido";
                        const productSku = isProductObject(item.product)
                          ? item.product.sku
                          : "-";

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {productName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU: {productSku}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {currentOrder.notes && (
              <Card>
                <CardHeader className="px-4 py-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                    {currentOrder.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-blue-900">
                  <DollarSign className="w-4 h-4" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700/70">Subtotal</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(currentOrder.subtotal)}
                  </span>
                </div>

                {currentOrder.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700/70">Impuestos</span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(currentOrder.tax)}
                    </span>
                  </div>
                )}

                {currentOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700/70">Descuento</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(currentOrder.discount)}
                    </span>
                  </div>
                )}

                <div className="border-t border-blue-200/50 pt-2 sm:pt-3 flex justify-between items-center">
                  <span className="font-bold text-blue-900">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    {formatCurrency(currentOrder.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  {currentOrder.type === MovementType.SALE ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                  {currentOrder.type === MovementType.SALE
                    ? "Cliente"
                    : "Proveedor"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 space-y-2">
                {currentOrder.customerName ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {currentOrder.customerName}
                    </p>
                    <div className="space-y-1.5">
                      {currentOrder.customerEmail && (
                        <a
                          href={`mailto:${currentOrder.customerEmail}`}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {currentOrder.customerEmail}
                          </span>
                        </a>
                      )}
                      {currentOrder.customerPhone && (
                        <a
                          href={`tel:${currentOrder.customerPhone}`}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{currentOrder.customerPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : isSupplierObject(currentOrder.supplier) ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {currentOrder.supplier.name}
                    </p>
                    {currentOrder.supplier.contactName && (
                      <p className="text-xs sm:text-sm text-gray-600">
                        Contacto: {currentOrder.supplier.contactName}
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {currentOrder.supplier.email && (
                        <a
                          href={`mailto:${currentOrder.supplier.email}`}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {currentOrder.supplier.email}
                          </span>
                        </a>
                      )}
                      {currentOrder.supplier.phone && (
                        <a
                          href={`tel:${currentOrder.supplier.phone}`}
                          className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{currentOrder.supplier.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No especificado</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="w-4 h-4" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Creado por</span>
                  <span className="font-medium text-gray-900 text-right">
                    {creatorName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(currentOrder.createdAt)}
                  </span>
                </div>
                {currentOrder.completedAt && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-600">Completada</span>
                    <span className="font-medium text-green-600 text-right">
                      {formatDate(currentOrder.completedAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="sm:hidden fixed bottom-4 right-4 z-40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
              >
                <MoreVertical className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2 mr-2">
              <div className="px-2 py-1.5 text-sm font-medium text-gray-500">
                Acciones rápidas
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/orders/${currentOrder._id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Orden
              </DropdownMenuItem>
              {isPurchase && (
                <DropdownMenuItem onClick={handleCopyWhatsAppMessage}>
                  <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                  Copiar WhatsApp
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleCompleteOrder}
                className="text-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCancelOrder}
                className="text-red-600"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
