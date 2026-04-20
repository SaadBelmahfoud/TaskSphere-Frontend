/*
 * ====================================================================
 * COMPOSANT UI : Input (Champ de saisie)
 * ====================================================================
 *
 * CORRECTION — React.forwardRef
 * ──────────────────────────────
 * PROBLÈME AVANT :
 *   Input était une simple fonction component. Quand react-hook-form
 *   fait {...register('email')}, il passe un props "ref" qui était
 *   ignoré par la fonction → warning "Function components cannot be
 *   given refs" dans la console.
 *
 * CONSÉQUENCE :
 *   react-hook-form ne pouvait pas attacher sa ref à l'input natif.
 *   Le formulaire fonctionnait partiellement via onChange, mais
 *   certains comportements (focus management, validation en temps réel)
 *   pouvaient être instables.
 *
 * SOLUTION :
 *   Utiliser React.forwardRef pour transmettre la ref du composant
 *   parent (react-hook-form) vers l'input HTML natif <input>.
 *
 * PRINCIPE forwardRef :
 *   forwardRef<H, P>((props, ref) => JSX) permet à un composant
 *   fonctionnel de recevoir une ref et de la transmettre à un enfant.
 *   C'est le pattern standard quand on utilise des bibliothèques de
 *   formulaire (react-hook-form, Formik, etc.).
 */
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
