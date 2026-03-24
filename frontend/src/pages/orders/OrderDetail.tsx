import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Printer,
  User as UserIcon,
  XCircle,
  Banknote,
  CreditCard,
  MessageSquare,
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
  }, [id]);

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

    // 1. Saludo inicial
    let message = `Hola, me gustaría solicitar la compra de los siguientes productos:\n\n`;

    // 2. Listado de productos (Nombre, Detalles/SKU y Cantidad)
    currentOrder.items.forEach((item) => {
      const productName = isProductObject(item.product)
        ? item.product.name
        : "Producto desconocido";

      message += `• *${productName}*\n`;
      message += `  Cantidad: ${item.quantity}\n\n`;
    });

    // 3. Nota (si existe)
    if (currentOrder.notes) {
      message += `*Nota:* ${currentOrder.notes}\n`;
    }

    // Copiar al portapapeles
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
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 text-sm px-3 py-1"
          >
            Pendiente
          </Badge>
        );
      case OrderStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1"
          >
            Completada
          </Badge>
        );
      case OrderStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1"
          >
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (isLoading || !currentOrder) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Get creator name safely
  const creatorName = isUserObject(currentOrder.createdBy)
    ? `${currentOrder.createdBy.firstName} ${currentOrder.createdBy.lastName}`
    : "Usuario desconocido";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/orders")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Orden {currentOrder.orderNumber}
              </h1>
              {getStatusBadge(currentOrder.status)}
            </div>
            <p className="text-gray-500">{getTypeLabel(currentOrder.type)}</p>
            {/* Mostrar tipo de pago solo para ventas */}
            {currentOrder.type === MovementType.SALE &&
              currentOrder.paymentType && (
                <>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1.5">
                    {getPaymentIcon(currentOrder.paymentType)}
                    <span
                      className={`text-sm font-medium ${
                        currentOrder.paymentType === "cash"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {getPaymentLabel(currentOrder.paymentType)}
                    </span>
                  </div>
                </>
              )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>

          {/* NUEVO BOTÓN PARA WHATSAPP */}
          {currentOrder.type === MovementType.PURCHASE &&
            currentOrder.status === OrderStatus.PENDING && (
              <Button
                variant="outline"
                onClick={handleCopyWhatsAppMessage}
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Copiar mensaje para WhatsApp
              </Button>
            )}

          {currentOrder.status === OrderStatus.PENDING && (
            <>
              <Button
                onClick={handleCompleteOrder}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar
              </Button>
              <Button variant="destructive" onClick={handleCancelOrder}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrder.items.map((item, index) => {
                    // Check if product is populated object
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
                            <p className="font-medium text-gray-900">
                              {productName}
                            </p>
                            <p className="text-sm text-gray-500">
                              SKU: {productSku}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
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
            </CardContent>
          </Card>

          {/* Notes */}
          {currentOrder.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {currentOrder.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(currentOrder.subtotal)}
                </span>
              </div>
              {currentOrder.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="font-medium">
                    {formatCurrency(currentOrder.tax)}
                  </span>
                </div>
              )}
              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Descuento</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(currentOrder.discount)}
                  </span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg text-blue-600">
                  {formatCurrency(currentOrder.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer/Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                {currentOrder.type === MovementType.SALE
                  ? "Cliente"
                  : "Proveedor"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentOrder.customerName ? (
                <>
                  <p className="font-medium text-gray-900">
                    {currentOrder.customerName}
                  </p>
                  {currentOrder.customerEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {currentOrder.customerEmail}
                    </div>
                  )}
                  {currentOrder.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {currentOrder.customerPhone}
                    </div>
                  )}
                </>
              ) : isSupplierObject(currentOrder.supplier) ? (
                <>
                  <p className="font-medium text-gray-900">
                    {currentOrder.supplier.name}
                  </p>
                  {currentOrder.supplier.contactName && (
                    <p className="text-sm text-gray-600">
                      Contacto: {currentOrder.supplier.contactName}
                    </p>
                  )}
                  {currentOrder.supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {currentOrder.supplier.email}
                    </div>
                  )}
                  {currentOrder.supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {currentOrder.supplier.phone}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No especificado</p>
              )}
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Creado por</span>
                <span className="font-medium">{creatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de creación</span>
                <span className="font-medium">
                  {formatDate(currentOrder.createdAt)}
                </span>
              </div>
              {currentOrder.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completada el</span>
                  <span className="font-medium text-green-600">
                    {formatDate(currentOrder.completedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
