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
  side?: "top" | "right" | "bottom" | "left";
}

export interface TourDef {
  id: string;
  title: string;
  description: string;
  steps: TourStepDef[];
}
