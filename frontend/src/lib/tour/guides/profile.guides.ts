import type { TourDef } from "../types";

export const profileEditInfoGuide: TourDef = {
  id: "profile-edit-info",
  title: "Cómo actualizar tu información personal",
  description: "Actualiza tu nombre, apellido o email.",
  steps: [
    {
      target: "profile.page-title",
      title: "Mi Perfil",
      description: "Aquí gestionas tu información personal y la seguridad de tu cuenta.",
    },
    {
      target: "profile.tab-general",
      title: "Información General",
      description: "Esta pestaña ya está abierta; aquí editas tus datos personales.",
    },
    {
      target: "profile.form.first-name-input",
      title: "Nombre y apellido",
      description: "Actualiza tu nombre o apellido si hace falta.",
    },
    {
      target: "profile.form.email-input",
      title: "Email",
      description: "El correo con el que inicias sesión.",
    },
    {
      target: "profile.form.submit-button",
      title: "Guardar cambios",
      description: "Guarda los cambios cuando termines.",
    },
  ],
};

export const profileChangePasswordGuide: TourDef = {
  id: "profile-change-password",
  title: "Cómo cambiar tu contraseña",
  description: "Actualiza tu contraseña desde la pestaña Seguridad.",
  steps: [
    {
      target: "profile.tab-security",
      title: "Pestaña Seguridad",
      description: "Haz clic en esta pestaña para cambiar tu contraseña.",
    },
    {
      target: "profile.password.current-input",
      title: "Contraseña actual",
      description: "Ingresa tu contraseña actual para confirmar el cambio.",
      newSegment: true,
    },
    {
      target: "profile.password.new-input",
      title: "Nueva contraseña",
      description: "Elige una nueva contraseña (mínimo 6 caracteres, con mayúscula, minúscula y número).",
    },
    {
      target: "profile.password.confirm-input",
      title: "Confirmar nueva contraseña",
      description: "Repite la nueva contraseña para confirmarla.",
    },
    {
      target: "profile.password.submit-button",
      title: "Cambiar contraseña",
      description: "Guarda el cambio con este botón.",
    },
  ],
};

export const profileGuides: TourDef[] = [
  profileEditInfoGuide,
  profileChangePasswordGuide,
];
