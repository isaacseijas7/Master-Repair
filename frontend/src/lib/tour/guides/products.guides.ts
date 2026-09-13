import type { TourDef } from "../types";

export const productsOverviewGuide: TourDef = {
  id: "products-overview",
  title: "Recorrido por la pantalla de Productos",
  description: "Un vistazo rápido a las partes principales de esta pantalla.",
  steps: [
    {
      target: "products.page-title",
      title: "Productos",
      description: "Aquí gestionas todo tu inventario de productos.",
    },
    {
      target: "products.search-input",
      title: "Buscar productos",
      description: "Busca por nombre, SKU o descripción.",
    },
    {
      target: "products.filters-entry",
      title: "Filtros",
      description: "Filtra la lista por categoría y por estado (activo/inactivo).",
    },
    {
      target: "products.create-button",
      title: "Nuevo producto",
      description: "Registra un producto nuevo desde aquí.",
    },
    {
      target: "products.row-actions-entry",
      title: "Acciones por producto",
      description: "Edita o elimina un producto existente desde este menú.",
    },
  ],
};

export const productsCreateGuide: TourDef = {
  id: "products-create",
  title: "Cómo crear un producto",
  description: "Pasos para registrar un producto nuevo.",
  steps: [
    {
      target: "products.create-button",
      title: "Nuevo producto",
      description: "Haz clic en este botón para empezar.",
      route: "/products",
    },
    {
      target: "products.form.name-input",
      title: "Nombre del producto",
      description: "El SKU se genera automáticamente; solo indica el nombre.",
      route: "/products/new",
    },
    {
      target: "products.form.category-select",
      title: "Categoría",
      description: "Selecciona la categoría a la que pertenece.",
    },
    {
      target: "products.form.supplier-select",
      title: "Proveedor",
      description: "Selecciona el proveedor de este producto.",
    },
    {
      target: "products.form.unit-price-input",
      title: "Precio unitario",
      description: "El precio de venta por unidad.",
    },
    {
      target: "products.form.stock-input",
      title: "Stock actual",
      description: "La cantidad de unidades disponibles hoy.",
    },
    {
      target: "products.form.active-switch",
      title: "Producto activo",
      description: "Solo los productos activos aparecen para vender.",
    },
    {
      target: "products.form.submit-button",
      title: "Crear producto",
      description: "Guarda el producto cuando todo esté listo.",
    },
  ],
};

export const productsEditGuide: TourDef = {
  id: "products-edit",
  title: "Cómo editar o eliminar un producto",
  description: "Abre un producto existente para modificarlo o eliminarlo.",
  steps: [
    {
      target: "products.row-actions-entry",
      title: "Abre un producto",
      description: "Selecciona un producto y abre su ficha desde aquí.",
      route: "/products",
    },
    {
      target: "products.form.stock-input",
      title: "Ajusta el stock",
      description: "Actualiza cualquier dato, como el stock disponible.",
      newSegment: true,
    },
    {
      target: "products.form.submit-button",
      title: "Guardar cambios",
      description: "Guarda los cambios con este botón.",
    },
    {
      target: "products.form.delete-button",
      title: "Eliminar producto",
      description: "Si ya no lo necesitas, puedes eliminarlo desde aquí.",
    },
  ],
};

export const productsGuides: TourDef[] = [
  productsOverviewGuide,
  productsCreateGuide,
  productsEditGuide,
];
