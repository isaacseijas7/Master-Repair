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
  animate: true,
  // Si un paso puntual no encuentra su elemento (p. ej. un campo que solo
  // aparece condicionalmente), driver.js lo salta en vez de romper el tour.
  skipMissingElement: true,
};

interface TourSegment {
  route: string;
  steps: TourStepDef[];
}

// Agrupa los pasos consecutivos que comparten ruta, para lanzar una
// instancia de driver.js por tramo y navegar entre tramos nosotros mismos.
function buildSegments(steps: TourStepDef[], currentPath: string): TourSegment[] {
  const segments: TourSegment[] = [];
  let currentRoute = steps[0]?.route ?? currentPath;

  for (const step of steps) {
    if (step.route) currentRoute = step.route;
    const last = segments[segments.length - 1];
    if (last && last.route === currentRoute) {
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

    async function runSegment(index: number, startAtLastStep = false) {
      const segment = segments[index];
      if (!segment) return;

      if (window.location.pathname !== segment.route) {
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

        return {
          // driver.js llama a este getter justo antes de resaltar el paso,
          // así que resuelve el candidato visible (móvil/escritorio) en ese
          // momento. Si no hay ninguno, skipMissingElement se encarga.
          element: (() => resolveTourTarget(step.target) ?? undefined) as () => Element,
          popover: {
            title: step.title,
            description: step.description,
            side: step.side,
            ...(isLastOfSegment && index < segments.length - 1
              ? {
                  onNextClick: () => {
                    driverObj.destroy();
                    void runSegment(index + 1);
                  },
                }
              : {}),
            ...(isFirstOfSegment && index > 0
              ? {
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
