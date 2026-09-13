import type { TourDef } from "../types";

export const clientsOverviewGuide: TourDef = {
  id: "clients-overview",
  title: "Recorrido por la pantalla de Clientes",
  description: "Un vistazo rápido a las partes principales de esta pantalla.",
  steps: [
    {
      target: "clients.page-title",
      title: "Clientes",
      description: "Aquí gestionas tus clientes y su historial de compras.",
    },
    {
      target: "clients.search-input",
      title: "Buscar clientes",
      description: "Busca por nombre, email o teléfono.",
    },
    {
      target: "clients.create-button",
      title: "Nuevo cliente",
      description: "Registra un cliente nuevo desde aquí.",
    },
    {
      target: "clients.row-actions-entry",
      title: "Acciones por cliente",
      description: "Abre el detalle o elimina un cliente desde este menú.",
    },
  ],
};

export const clientsCreateGuide: TourDef = {
  id: "clients-create",
  title: "Cómo registrar un cliente",
  description: "Pasos para registrar un cliente nuevo.",
  steps: [
    {
      target: "clients.create-button",
      title: "Nuevo cliente",
      description: "Haz clic en este botón para empezar.",
      newSegment: true,
    },
    {
      target: "clients.form.name-input",
      title: "Nombre",
      description: "El nombre completo del cliente (obligatorio).",
      newSegment: true,
    },
    {
      target: "clients.form.email-input",
      title: "Email",
      description: "Correo de contacto del cliente (opcional).",
    },
    {
      target: "clients.form.phone-input",
      title: "Teléfono",
      description: "Número de contacto del cliente (opcional).",
    },
    {
      target: "clients.form.submit-button",
      title: "Guardar",
      description: "Registra al cliente con este botón.",
    },
  ],
};

export const clientsEditGuide: TourDef = {
  id: "clients-edit",
  title: "Cómo editar un cliente",
  description: "Actualiza los datos de contacto de un cliente existente.",
  steps: [
    {
      target: "clients.row-actions-entry",
      title: "Abre un cliente",
      description: "Selecciona un cliente y abre su detalle desde aquí.",
      route: "/clients",
    },
    {
      target: "clients.detail-edit-button",
      title: "Editar",
      description: "Desde el detalle del cliente, usa este botón para modificar sus datos.",
      newSegment: true,
    },
    {
      target: "clients.detail.name-input",
      title: "Actualiza los datos",
      description: "Cambia el nombre, email o teléfono según haga falta.",
      newSegment: true,
    },
    {
      target: "clients.detail.submit-button",
      title: "Guardar cambios",
      description: "Guarda los cambios con este botón.",
    },
  ],
};

export const clientsGuides: TourDef[] = [
  clientsOverviewGuide,
  clientsCreateGuide,
  clientsEditGuide,
];
