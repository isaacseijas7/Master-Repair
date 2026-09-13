import type { TourDef } from "../types";

export const categoriesOverviewGuide: TourDef = {
  id: "categories-overview",
  title: "Recorrido por la pantalla de Categorías",
  description: "Un vistazo rápido a las partes principales de esta pantalla.",
  steps: [
    {
      target: "categories.page-title",
      title: "Categorías",
      description: "Aquí gestionas las categorías que agrupan tus productos.",
    },
    {
      target: "categories.search-input",
      title: "Buscar categorías",
      description: "Busca una categoría por su nombre.",
    },
    {
      target: "categories.create-button",
      title: "Nueva categoría",
      description: "Crea una categoría nueva desde aquí.",
    },
    {
      target: "categories.row-actions-entry",
      title: "Acciones por categoría",
      description: "Edita o elimina una categoría existente desde este menú.",
    },
  ],
};

export const categoriesManageGuide: TourDef = {
  id: "categories-manage",
  title: "Cómo crear o editar una categoría",
  description: "El mismo formulario se usa tanto para crear como para editar.",
  steps: [
    {
      target: "categories.create-button",
      title: "Nueva categoría",
      description:
        "Haz clic aquí para crear una (o en \"Editar\" desde el menú de una existente).",
      newSegment: true,
    },
    {
      target: "categories.form.name-input",
      title: "Nombre",
      description: "El nombre de la categoría (obligatorio).",
      newSegment: true,
    },
    {
      target: "categories.form.description-input",
      title: "Descripción",
      description: "Una descripción opcional para identificarla mejor.",
    },
    {
      target: "categories.form.color-input",
      title: "Color",
      description:
        "Elige un color identificativo; se usa como etiqueta en productos y reportes.",
    },
    {
      target: "categories.form.submit-button",
      title: "Guardar",
      description: "Guarda los cambios cuando termines.",
    },
  ],
};

export const categoriesGuides: TourDef[] = [
  categoriesOverviewGuide,
  categoriesManageGuide,
];
