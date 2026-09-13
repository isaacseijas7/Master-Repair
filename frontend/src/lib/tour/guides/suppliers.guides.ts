import type { TourDef } from "../types";

export const suppliersOverviewGuide: TourDef = {
  id: "suppliers-overview",
  title: "Recorrido por la pantalla de Proveedores",
  description: "Un vistazo rápido a las partes principales de esta pantalla.",
  steps: [
    {
      target: "suppliers.page-title",
      title: "Proveedores",
      description: "Aquí gestionas los proveedores de tu inventario.",
    },
    {
      target: "suppliers.search-input",
      title: "Buscar proveedores",
      description: "Busca un proveedor por nombre.",
    },
    {
      target: "suppliers.create-button",
      title: "Nuevo proveedor",
      description: "Registra un proveedor nuevo desde aquí.",
    },
    {
      target: "suppliers.row-actions-entry",
      title: "Acciones por proveedor",
      description: "Edita o elimina un proveedor existente desde este menú.",
    },
  ],
};

export const suppliersManageGuide: TourDef = {
  id: "suppliers-manage",
  title: "Cómo registrar o editar un proveedor",
  description: "El mismo formulario se usa tanto para crear como para editar.",
  steps: [
    {
      target: "suppliers.create-button",
      title: "Nuevo proveedor",
      description:
        "Haz clic aquí para registrar uno (o en \"Editar\" desde el menú de uno existente).",
      newSegment: true,
    },
    {
      target: "suppliers.form.name-input",
      title: "Nombre",
      description: "El nombre del proveedor (obligatorio).",
      newSegment: true,
    },
    {
      target: "suppliers.form.contact-input",
      title: "Persona de contacto",
      description: "El nombre de quien atiende los pedidos con este proveedor.",
    },
    {
      target: "suppliers.form.email-input",
      title: "Email",
      description: "Correo de contacto del proveedor.",
    },
    {
      target: "suppliers.form.phone-input",
      title: "Teléfono",
      description: "Número de contacto del proveedor.",
    },
    {
      target: "suppliers.form.submit-button",
      title: "Guardar",
      description: "Guarda los cambios cuando termines.",
    },
  ],
};

export const suppliersGuides: TourDef[] = [
  suppliersOverviewGuide,
  suppliersManageGuide,
];
