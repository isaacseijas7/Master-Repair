import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

interface RoleRouteProps {
  roles: string[];
  children: React.ReactNode;
}

// ProtectedRoute (en App.tsx) solo valida que haya sesión, nunca el rol.
// Antes, un Cashier podía navegar directo a una URL como
// /orders/:id/edit o /products/:id (edición) y ver el formulario completo
// aunque el backend fuera a rechazar el envío con 403 — esta ruta corta
// eso antes de renderizar el formulario, redirigiendo al dashboard.
export function RoleRoute({ roles, children }: RoleRouteProps) {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
