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
import { ordersGuides } from "./guides/orders.guides";
import type { TourDef } from "./types";

export const tourRegistry: Record<string, TourDef[]> = {
  "/orders": ordersGuides,
};

// Busca las guías del módulo cuyo prefijo de ruta calce con `pathname`,
// usando el prefijo más largo (para que /orders/123/edit también encuentre
// las guías registradas bajo "/orders").
export function getGuidesForPath(pathname: string): TourDef[] {
  const match = Object.keys(tourRegistry)
    .filter((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.length - a.length)[0];

  return match ? tourRegistry[match] : [];
}
