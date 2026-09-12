import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Antes no existía ningún ErrorBoundary en la app: un throw durante el
// render de cualquier página (ej. una forma de dato inesperada de la API)
// dejaba al usuario con una pantalla en blanco sin ninguna posibilidad de
// recuperación dentro de la app.
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error no controlado en la interfaz:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-bold text-gray-900">
              Ocurrió un error inesperado
            </h1>
            <p className="text-gray-500">
              La página encontró un problema y no pudo continuar. Puedes
              intentar recargarla; si el problema persiste, contacta a
              soporte.
            </p>
            <Button onClick={() => window.location.assign("/")}>
              Volver al inicio
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
