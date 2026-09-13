import { driver, type Config, type DriveStep } from "driver.js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { resolveTourTarget, waitForTourTarget } from "./dom";
import type { TourDef, TourStepDef } from "./types";

const driverConfig: Omit<Config, "steps"> = {
  showProgress: true,
  progressText: "Paso {{current}} de {{total}}",
  nextBtnText: "Siguiente",
  prevBtnText: "Atrás",
  doneBtnText: "Finalizar",
  overlayColor: "#0f172a",
  overlayOpacity: 0.5,
  stagePadding: 4,
  // Con animate:true, driver.js tarda ~400ms en terminar de mover el
  // recuadro resaltado de un paso a otro; si el usuario hace clic en
  // "Siguiente" antes de que termine esa transición, el resaltado se queda
  // "pegado" en el elemento anterior aunque el texto del popover sí avance
  // (bug reproducido con clics rápidos). Sin animación, el resaltado se
  // reposiciona de inmediato en cada paso, así que no hay ventana en la que
  // un clic rápido pueda dejarlo inconsistente.
  animate: false,
  // Si un paso puntual no encuentra su elemento (p. ej. un campo que solo
  // aparece condicionalmente), driver.js lo salta en vez de romper el tour.
  skipMissingElement: true,
};

interface TourSegment {
  // undefined = destino desconocido (p. ej. una orden concreta con :id
  // dinámico que el usuario debe abrir manualmente); no se navega, solo se
  // espera a que el elemento aparezca.
  route: string | undefined;
  steps: TourStepDef[];
}

// Agrupa los pasos consecutivos que comparten ruta, para lanzar una
// instancia de driver.js por tramo y navegar entre tramos nosotros mismos.
// Un paso con `newSegment` fuerza un tramo nuevo aunque no traiga `route`
// (en vez de asumir, por defecto, que sigue en la misma página que el
// anterior) — necesario para pasos que dependen de una navegación manual del
// usuario, donde si no se espera su elemento por separado, driver.js lo daría
// por "no encontrado" en silencio dentro del tramo previo.
function buildSegments(steps: TourStepDef[], currentPath: string): TourSegment[] {
  const segments: TourSegment[] = [];
  let currentRoute: string | undefined = steps[0]?.route ?? currentPath;

  for (const step of steps) {
    if (step.newSegment && !step.route) {
      currentRoute = undefined;
    } else if (step.route) {
      currentRoute = step.route;
    }

    const last = segments[segments.length - 1];
    if (last && !step.newSegment && last.route === currentRoute) {
      last.steps.push(step);
    } else {
      segments.push({ route: currentRoute, steps: [step] });
    }
  }

  return segments;
}

export function useTourRunner() {
  const navigate = useNavigate();

  function startTour(tour: TourDef) {
    if (tour.steps.length === 0) return;

    const segments = buildSegments(tour.steps, window.location.pathname);
    const totalSteps = tour.steps.length;
    // Cada tramo es una instancia de driver.js independiente, así que su
    // contador de progreso interno ("Paso 1 de N") reinicia por tramo; para
    // que el usuario vea el progreso real de la guía completa, calculamos
    // nosotros el índice global de cada paso y se lo pasamos ya formateado.
    const segmentOffsets = segments.reduce<number[]>((offsets, _segment, i) => {
      offsets.push(i === 0 ? 0 : offsets[i - 1] + segments[i - 1].steps.length);
      return offsets;
    }, []);

    async function runSegment(index: number, startAtLastStep = false) {
      const segment = segments[index];
      if (!segment) return;

      if (segment.route && window.location.pathname !== segment.route) {
        navigate(segment.route);
      }

      const found = await waitForTourTarget(segment.steps[0].target);
      if (!found) {
        toast.error(
          "No pudimos encontrar este paso automáticamente. Ábrelo manualmente y vuelve a intentar la guía.",
        );
        return;
      }

      const driverSteps: DriveStep[] = segment.steps.map((step, stepIndex) => {
        const isFirstOfSegment = stepIndex === 0;
        const isLastOfSegment = stepIndex === segment.steps.length - 1;
        const globalIndex = segmentOffsets[index] + stepIndex;

        return {
          // driver.js llama a este getter justo antes de resaltar el paso,
          // así que resuelve el candidato visible (móvil/escritorio) en ese
          // momento. Si no hay ninguno, skipMissingElement se encarga.
          element: (() => resolveTourTarget(step.target) ?? undefined) as () => Element,
          popover: {
            title: step.title,
            description: step.description,
            side: step.side,
            // Texto ya formateado (sin {{current}}/{{total}}) para que no lo
            // vuelva a calcular con el índice LOCAL del tramo.
            progressText: `Paso ${globalIndex + 1} de ${totalSteps}`,
            ...(isLastOfSegment && index < segments.length - 1
              ? {
                  // Sin esto, driver.js reemplaza el texto por el de
                  // "Finalizar" en el último paso de CADA tramo (cree que
                  // ese tramo es todo el tour), aunque en realidad avanza al
                  // siguiente tramo/ruta.
                  nextBtnText: "Siguiente",
                  onNextClick: () => {
                    driverObj.destroy();
                    void runSegment(index + 1);
                  },
                }
              : {}),
            ...(isFirstOfSegment && index > 0
              ? {
                  // driver.js deshabilita el botón "Atrás" a nivel de DOM en
                  // el primer paso de cada instancia (no sabe que este tramo
                  // continúa uno anterior en otra ruta); hay que forzar la
                  // lista de botones deshabilitados a vacía para poder
                  // volver al tramo anterior con onPrevClick.
                  disableButtons: [],
                  onPrevClick: () => {
                    driverObj.destroy();
                    void runSegment(index - 1, true);
                  },
                }
              : {}),
          },
        };
      });

      const driverObj = driver({ ...driverConfig, steps: driverSteps });
      driverObj.drive(startAtLastStep ? driverSteps.length - 1 : 0);
    }

    void runSegment(0);
  }

  return { startTour };
}
