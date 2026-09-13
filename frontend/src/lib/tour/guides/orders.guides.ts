import type { TourDef } from "../types";

export const ordersOverviewGuide: TourDef = {
  id: "orders-overview",
  title: "Recorrido por la pantalla de Órdenes",
  description: "Un vistazo rápido a las partes principales de esta pantalla.",
  steps: [
    {
      target: "orders.page-title",
      title: "Órdenes",
      description:
        "Aquí gestionas todas las ventas, compras y devoluciones del negocio.",
    },
    {
      target: "orders.pending-stat",
      title: "Órdenes pendientes",
      description:
        "Muestra cuántas órdenes están esperando ser completadas o canceladas.",
    },
    {
      target: "orders.search-input",
      title: "Buscar órdenes",
      description: "Busca por número de orden o por el nombre del cliente.",
    },
    {
      target: "orders.filters-entry",
      title: "Filtros",
      description: "Filtra la lista por tipo de orden (venta/compra) y por estado.",
    },
    {
      target: "orders.create-button",
      title: "Nueva orden",
      description: "Desde aquí creas una orden de venta, compra o devolución.",
    },
    {
      target: "orders.row-actions-entry",
      title: "Acciones por orden",
      description:
        "En cada orden pendiente puedes ver el detalle, completarla o cancelarla.",
    },
  ],
};

export const ordersCreateGuide: TourDef = {
  id: "orders-create",
  title: "Cómo crear una orden",
  description: "Pasos para registrar una nueva venta o compra.",
  steps: [
    {
      target: "orders.create-button",
      title: "Nueva orden",
      description: "Haz clic en este botón para empezar.",
      route: "/orders",
    },
    {
      target: "orders.form.type-select",
      title: "Tipo de orden",
      description: "Elige si es una venta o una compra.",
      route: "/orders/new",
    },
    {
      target: "orders.form.payment-type-select",
      title: "Forma de pago",
      description: "Para ventas, indica si es al contado o a crédito.",
    },
    {
      target: "orders.form.client-selector",
      title: "Cliente o proveedor",
      description:
        "Busca y selecciona el cliente (o proveedor, si es una compra). Si no existe, puedes registrarlo desde aquí mismo con el botón de al lado.",
    },
    {
      target: "orders.form.product-search-input",
      title: "Buscar producto",
      description: "Escribe el nombre o SKU del producto que quieres agregar.",
    },
    {
      target: "orders.form.product-quantity-input",
      title: "Cantidad",
      description: "Define cuántas unidades de ese producto vas a agregar.",
    },
    {
      target: "orders.form.add-product-button",
      title: "Agregar producto",
      description: "Agrega el producto seleccionado a la orden.",
    },
    {
      target: "orders.form.items-table",
      title: "Productos de la orden",
      description:
        "Aquí ves todos los productos agregados; puedes ajustar la cantidad de cada uno o quitarlo.",
    },
    {
      target: "orders.form.notes-textarea",
      title: "Notas",
      description: "Agrega cualquier comentario adicional sobre la orden (opcional).",
    },
    {
      target: "orders.form.submit-button",
      title: "Crear orden",
      description: "Cuando todo esté listo, guarda la orden con este botón.",
    },
  ],
};

export const ordersEditGuide: TourDef = {
  id: "orders-edit",
  title: "Cómo editar una orden",
  description: "Solo las órdenes en estado Pendiente se pueden editar.",
  steps: [
    {
      target: "orders.row-actions-entry",
      title: "Abre una orden pendiente",
      description:
        "Selecciona una orden con estado Pendiente y abre su detalle desde aquí.",
      route: "/orders",
    },
    {
      target: ["orders.detail-edit-button", "orders.detail-actions-trigger"],
      title: "Editar orden",
      description:
        "Desde el detalle de una orden pendiente, usa este botón para modificarla.",
      // El destino (la página de detalle de ESA orden) depende de cuál
      // orden abra el usuario; no hay una ruta fija a la que navegar.
      newSegment: true,
    },
    {
      target: "orders.form.items-table",
      title: "Ajusta los productos",
      description: "Puedes cambiar cantidades, quitar o agregar productos.",
      // Aparece recién cuando el usuario hace clic en el botón "Editar" real
      // (no en "Siguiente"), lo que navega a /orders/:id/edit.
      newSegment: true,
    },
    {
      target: "orders.form.submit-button",
      title: "Guardar cambios",
      description: "Actualiza la orden con este botón cuando termines.",
    },
  ],
};

export const ordersStatusChangeGuide: TourDef = {
  id: "orders-status-change",
  title: "Cómo cambiar el estado de una orden",
  description: "Marca una orden pendiente como completada.",
  steps: [
    {
      target: "orders.row-actions-entry",
      title: "Abre una orden pendiente",
      description: "Selecciona una orden con estado Pendiente y abre su detalle.",
      route: "/orders",
    },
    {
      target: ["orders.detail-complete-button", "orders.detail-fab-trigger"],
      title: "Completar orden",
      description:
        "Usa este botón para marcar la orden como completada una vez finalizada.",
      // El destino (la página de detalle de ESA orden) depende de cuál
      // orden abra el usuario; no hay una ruta fija a la que navegar.
      newSegment: true,
    },
  ],
};

export const ordersCancelGuide: TourDef = {
  id: "orders-cancel",
  title: "Cómo cancelar una orden",
  description: "Cancela una orden que ya no se va a procesar.",
  steps: [
    {
      target: "orders.row-actions-entry",
      title: "Abre una orden pendiente",
      description: "Selecciona una orden con estado Pendiente y abre su detalle.",
      route: "/orders",
    },
    {
      target: ["orders.detail-cancel-button", "orders.detail-fab-trigger"],
      title: "Cancelar orden",
      description: "Usa este botón para cancelar la orden. Se te pedirá confirmación.",
      // El destino (la página de detalle de ESA orden) depende de cuál
      // orden abra el usuario; no hay una ruta fija a la que navegar.
      newSegment: true,
    },
  ],
};

export const ordersGuides: TourDef[] = [
  ordersOverviewGuide,
  ordersCreateGuide,
  ordersEditGuide,
  ordersStatusChangeGuide,
  ordersCancelGuide,
];
