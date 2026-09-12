import { useEffect } from "react";
import { toast } from "sonner";

// Antes solo Profile.tsx mostraba el `error` de su store con un toast; el
// resto de las páginas de listado (Productos, Categorías, Proveedores,
// Clientes, Órdenes) dejaban el error del fetch inicial guardado en el
// store sin mostrarlo nunca, así que una falla de red/permiso se veía
// igual que "no hay datos".
export function useStoreErrorToast(
  error: string | null,
  clearError: () => void,
) {
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);
}
