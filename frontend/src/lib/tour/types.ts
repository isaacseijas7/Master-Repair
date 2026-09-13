// Un paso puede tener más de un selector candidato porque la misma acción
// suele renderizarse como dos elementos DOM distintos en móvil vs. escritorio
// (buscador duplicado, botón inline vs. item de menú, etc.). El motor elige
// el primero que esté realmente visible.
export interface TourStepDef {
  target: string | string[];
  title: string;
  description: string;
  /** Ruta a la que navegar antes de este paso, si es distinta a la del paso anterior. */
  route?: string;
  /**
   * Fuerza el inicio de un nuevo tramo aunque no se indique `route` (para
   * pasos cuyo destino depende de que el usuario navegue manualmente, como
   * abrir una orden concreta con :id dinámico). Sin esto, el motor asumiría
   * que el paso ya está en la página actual y no esperaría a que su
   * elemento aparezca.
   */
  newSegment?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export interface TourDef {
  id: string;
  title: string;
  description: string;
  steps: TourStepDef[];
}
