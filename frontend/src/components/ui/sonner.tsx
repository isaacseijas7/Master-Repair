import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // Antes: "var(--popover)" a secas. En este proyecto las variables
          // de tema (index.css) son tripletas HSL crudas ("0 0% 100%"), no
          // colores completos — Tailwind las usa siempre envueltas en
          // hsl(var(--x)) (ver tailwind.config.js). Sin el wrapper,
          // "background: var(--normal-bg)" es un valor inválido y el
          // navegador lo descarta, dejando el toast con fondo transparente:
          // por eso se veía "detrás" del overlay del modal (en realidad
          // estaba encima, pero transparente, y se veía el gris a través).
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
