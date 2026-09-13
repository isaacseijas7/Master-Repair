// Registro de guías disponibles por módulo, indexado por el prefijo de ruta
// de ese módulo.
//
// Para agregar un módulo nuevo (por ejemplo Productos):
//   1. Agrega atributos `data-tour="products.xxx"` a los elementos reales
//      que quieras señalar en Products.tsx / ProductDetail.tsx.
//   2. Crea `guides/products.guides.ts` exportando `productsGuides: TourDef[]`
//      con la misma forma que `guides/orders.guides.ts`.
//   3. Agrega una línea abajo: `"/products": productsGuides`.
// No hace falta tocar ningún otro archivo.
import { dashboardGuides } from "./guides/dashboard.guides";
import { ordersGuides } from "./guides/orders.guides";
import { productsGuides } from "./guides/products.guides";
import { categoriesGuides } from "./guides/categories.guides";
import { suppliersGuides } from "./guides/suppliers.guides";
import { clientsGuides } from "./guides/clients.guides";
import { usersGuides } from "./guides/users.guides";
import { profileGuides } from "./guides/profile.guides";
import type { TourDef } from "./types";

export const tourRegistry: Record<string, TourDef[]> = {
  "/": dashboardGuides,
  "/orders": ordersGuides,
  "/products": productsGuides,
  "/categories": categoriesGuides,
  "/suppliers": suppliersGuides,
  "/clients": clientsGuides,
  "/users": usersGuides,
  "/profile": profileGuides,
};

// Busca las guías del módulo cuyo prefijo de ruta calce con `pathname`,
// usando el prefijo más largo (para que /orders/123/edit también encuentre
// las guías registradas bajo "/orders"). El prefijo raíz "/" solo calza con
// el propio Dashboard, no con el resto de rutas (todas empiezan con "/" pero
// ninguna con "//").
export function getGuidesForPath(pathname: string): TourDef[] {
  const match = Object.keys(tourRegistry)
    .filter((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.length - a.length)[0];

  return match ? tourRegistry[match] : [];
}
