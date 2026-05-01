"use client"

/**
 * CORRECTION : Utilise notre ThemeProvider personnalisé au lieu de next-themes.
 *
 * PROBLÈME : next-themes injecte un <script> tag que React 19 rejette.
 * Le composant shadcn/ui sonner.tsx importait useTheme de "next-themes",
 * ce qui chargeait le module next-themes dans le bundle client et provoquait
 * l'erreur "Encountered a script tag while rendering React component".
 *
 * SOLUTION : Importer useTheme de notre ThemeProvider personnalisé qui
 * ne génère PAS de <script> tag et est compatible React 19.
 */
import { useTheme } from "@/providers/ThemeProvider"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme = "light" } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
