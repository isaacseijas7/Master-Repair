import { forwardRef, type CSSProperties } from "react";
import { BarChart3, Mail, Phone } from "lucide-react";
import { isClientObject } from "@/helpers/isClientObject";
import { isProductObject } from "@/helpers/isProductObject";
import { isSupplierObject } from "@/helpers/isSupplierObject";
import { isUserObject } from "@/helpers/isUserObject";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MovementType, OrderStatus, type Order } from "@/types";

interface OrderPrintTemplateProps {
  order: Order;
}

const TYPE_LABELS: Record<string, string> = {
  [MovementType.SALE]: "Orden de Venta",
  [MovementType.PURCHASE]: "Orden de Compra",
  [MovementType.RETURN]: "Orden de Devolución",
  [MovementType.ADJUSTMENT]: "Orden de Ajuste",
};

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: "Pendiente",
  [OrderStatus.COMPLETED]: "Completada",
  [OrderStatus.CANCELLED]: "Cancelada",
};

const STATUS_STYLES: Record<string, CSSProperties> = {
  [OrderStatus.PENDING]: {
    backgroundColor: "#fefce8",
    color: "#a16207",
    border: "1px solid #fde68a",
  },
  [OrderStatus.COMPLETED]: {
    backgroundColor: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
  },
  [OrderStatus.CANCELLED]: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
};

export const OrderPrintTemplate = forwardRef<HTMLDivElement, OrderPrintTemplateProps>(
  ({ order }, ref) => {
    const creatorName = isUserObject(order.createdBy)
      ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
      : "Usuario desconocido";

    const contact = isClientObject(order.client)
      ? {
          label: "Cliente",
          name: order.client.name,
          email: order.client.email,
          phone: order.client.phone,
        }
      : order.customerName
      ? {
          label: "Cliente",
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
        }
      : isSupplierObject(order.supplier)
      ? {
          label: "Proveedor",
          name: order.supplier.name,
          email: order.supplier.email,
          phone: order.supplier.phone,
        }
      : null;

    return (
      <div
        ref={ref}
        style={{
          width: "800px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          color: "#111827",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          padding: "40px",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #1d4ed8",
            paddingBottom: "20px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3 style={{ width: "20px", height: "20px", color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#111827" }}>
                Máster Repair
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                Punto de venta y reparaciones
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1d4ed8" }}>
              {TYPE_LABELS[order.type] || "Orden"}
            </div>
            <div style={{ fontSize: "13px", color: "#374151", marginTop: "2px" }}>
              {order.orderNumber}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "2px 10px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 600,
                ...(STATUS_STYLES[order.status] || {}),
              }}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "6px",
                letterSpacing: "0.05em",
              }}
            >
              {contact?.label || "Cliente / Proveedor"}
            </div>
            {contact ? (
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                  {contact.name}
                </div>
                {contact.email && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#4b5563",
                      marginTop: "4px",
                    }}
                  >
                    <Mail style={{ width: "12px", height: "12px" }} />
                    {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#4b5563",
                      marginTop: "2px",
                    }}
                  >
                    <Phone style={{ width: "12px", height: "12px" }} />
                    {contact.phone}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: "#9ca3af" }}>No especificado</div>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "6px",
                letterSpacing: "0.05em",
              }}
            >
              Detalles de la orden
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ color: "#6b7280" }}>Fecha</span>
              <span style={{ fontWeight: 600 }}>{formatDate(order.createdAt)}</span>
            </div>
            {order.completedAt && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ color: "#6b7280" }}>Completada</span>
                <span style={{ fontWeight: 600 }}>{formatDate(order.completedAt)}</span>
              </div>
            )}
            {order.paymentType && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ color: "#6b7280" }}>Forma de pago</span>
                <span style={{ fontWeight: 600 }}>
                  {order.paymentType === "cash" ? "Contado" : "Crédito"}
                </span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ color: "#6b7280" }}>Atendido por</span>
              <span style={{ fontWeight: 600 }}>{creatorName}</span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
          <thead>
            <tr style={{ backgroundColor: "#eff6ff" }}>
              <th style={thStyle("left")}>Producto</th>
              <th style={thStyle("left")}>SKU</th>
              <th style={thStyle("right")}>Cant.</th>
              <th style={thStyle("right")}>P. Unit.</th>
              <th style={thStyle("right")}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const productName = isProductObject(item.product)
                ? item.product.name
                : "Producto desconocido";
              const productSku = isProductObject(item.product) ? item.product.sku : "-";
              return (
                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle("left")}>{productName}</td>
                  <td style={{ ...tdStyle("left"), color: "#6b7280" }}>{productSku}</td>
                  <td style={tdStyle("right")}>{item.quantity}</td>
                  <td style={tdStyle("right")}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ ...tdStyle("right"), fontWeight: 600 }}>
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
          <div style={{ width: "260px" }}>
            <div style={totalRowStyle}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.tax > 0 && (
              <div style={totalRowStyle}>
                <span style={{ color: "#6b7280" }}>Impuestos</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div style={totalRowStyle}>
                <span style={{ color: "#6b7280" }}>Descuento</span>
                <span style={{ color: "#dc2626" }}>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "2px solid #1d4ed8",
                marginTop: "8px",
                paddingTop: "8px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#1d4ed8",
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: "6px",
                letterSpacing: "0.05em",
              }}
            >
              Notas
            </div>
            <div
              style={{
                whiteSpace: "pre-wrap",
                color: "#374151",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "10px 12px",
              }}
            >
              {order.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "16px",
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "11px",
          }}
        >
          <div>Gracias por confiar en Máster Repair</div>
          <div style={{ marginTop: "2px" }}>
            Documento generado el {formatDate(new Date())}
          </div>
        </div>
      </div>
    );
  }
);

OrderPrintTemplate.displayName = "OrderPrintTemplate";

function thStyle(align: "left" | "right") {
  return {
    textAlign: align,
    padding: "8px 10px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#1e40af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.03em",
  };
}

function tdStyle(align: "left" | "right") {
  return {
    textAlign: align,
    padding: "8px 10px",
  };
}

const totalRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "3px 0",
};
