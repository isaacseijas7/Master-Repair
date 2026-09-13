function toSelector(name: string): string {
  return `[data-tour="${name}"]`;
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// De la lista de selectores candidatos (uno por variante móvil/escritorio de
// un mismo control), devuelve el primero que esté realmente visible; si
// ninguno lo está, devuelve el primer match encontrado igualmente (mejor
// resaltar algo, aunque esté oculto, que no encontrar nada).
export function resolveTourTarget(target: string | string[]): HTMLElement | null {
  const names = Array.isArray(target) ? target : [target];
  let firstMatch: HTMLElement | null = null;

  for (const name of names) {
    const elements = document.querySelectorAll<HTMLElement>(toSelector(name));
    for (const el of elements) {
      if (!firstMatch) firstMatch = el;
      if (isVisible(el)) return el;
    }
  }

  return firstMatch;
}

// Espera a que el elemento aparezca en el DOM (por ejemplo, tras navegar de
// ruta y que el formulario/detalle termine de montarse) usando un
// MutationObserver en vez de un polling con setInterval.
export function waitForTourTarget(
  target: string | string[],
  timeoutMs = 2500,
): Promise<HTMLElement | null> {
  const immediate = resolveTourTarget(target);
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    const cleanup = () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };

    const observer = new MutationObserver(() => {
      const found = resolveTourTarget(target);
      if (found) {
        cleanup();
        resolve(found);
      }
    });

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}
