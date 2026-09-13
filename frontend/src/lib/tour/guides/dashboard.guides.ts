import type { TourDef } from "../types";

export const dashboardOverviewGuide: TourDef = {
  id: "dashboard-overview",
  title: "Recorrido por el Dashboard",
  description: "Un vistazo rápido a las métricas y accesos principales.",
  steps: [
    {
      target: "dashboard.page-title",
      title: "Dashboard",
      description:
        "Aquí ves un resumen general del negocio: inventario, ventas y alertas.",
    },
    {
      target: "dashboard.metrics-grid",
      title: "Métricas principales",
      description:
        "Totales de productos, stock, ventas del día/mes y órdenes pendientes. Haz clic en cualquier tarjeta para ir directo a esa sección.",
    },
    {
      target: "dashboard.revenue-chart",
      title: "Ingresos mensuales",
      description: "Evolución de los ingresos mes a mes (solo visible para roles con acceso financiero).",
    },
    {
      target: "dashboard.stock-alerts",
      title: "Alertas de stock bajo",
      description: "Productos que están por debajo de su stock mínimo y necesitan reposición.",
    },
    {
      target: "dashboard.recent-orders",
      title: "Órdenes recientes",
      description: "Las últimas órdenes registradas en el sistema.",
    },
  ],
};

export const dashboardGuides: TourDef[] = [dashboardOverviewGuide];
