import type { TourDef } from "../types";

export const usersOverviewGuide: TourDef = {
  id: "users-overview",
  title: "Recorrido por la pantalla de Usuarios",
  description: "Un vistazo rápido a las partes principales de esta pantalla.",
  steps: [
    {
      target: "users.page-title",
      title: "Usuarios",
      description: "Aquí administras las cuentas y roles del sistema (solo administradores).",
    },
    {
      target: "users.search-input",
      title: "Buscar usuarios",
      description: "Busca por nombre o email.",
    },
    {
      target: "users.filters-entry",
      title: "Filtros",
      description: "Filtra la lista por rol y por estado.",
    },
    {
      target: "users.create-button",
      title: "Nuevo usuario",
      description: "Crea una cuenta nueva desde aquí.",
    },
    {
      target: "users.row-actions-entry",
      title: "Acciones por usuario",
      description: "Edita o elimina un usuario existente desde este menú.",
    },
  ],
};

export const usersManageGuide: TourDef = {
  id: "users-manage",
  title: "Cómo crear o editar un usuario",
  description: "El mismo formulario se usa tanto para crear como para editar.",
  steps: [
    {
      target: "users.create-button",
      title: "Nuevo usuario",
      description:
        "Haz clic aquí para crear uno (o en \"Editar\" desde el menú de uno existente).",
      newSegment: true,
    },
    {
      target: "users.form.first-name-input",
      title: "Nombre y apellido",
      description: "Los datos personales del usuario.",
      newSegment: true,
    },
    {
      target: "users.form.email-input",
      title: "Email",
      description: "Será el correo con el que inicie sesión.",
    },
    {
      target: "users.form.password-input",
      title: "Contraseña",
      description: "Solo se pide al crear la cuenta; mínimo 6 caracteres con mayúscula, minúscula y número.",
    },
    {
      target: "users.form.role-select",
      title: "Rol",
      description: "Define qué puede hacer este usuario en el sistema.",
    },
    {
      target: "users.form.active-switch",
      title: "Usuario activo",
      description: "Un usuario inactivo no puede iniciar sesión.",
    },
    {
      target: "users.form.submit-button",
      title: "Guardar",
      description: "Guarda los cambios cuando termines.",
    },
  ],
};

export const usersGuides: TourDef[] = [usersOverviewGuide, usersManageGuide];
