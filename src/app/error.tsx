/**
 * ═══════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY : Root Error Page
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 1 : Error Boundaries (error.tsx per route)
 * ─────────────────────────────────────────────────────────────────
 *
 * PRINCIPE NEXT.JS — Error Boundaries :
 *   Next.js utilise les React Error Boundaries via le fichier error.tsx.
 *   Quand une erreur non gérée se produit dans un composant client,
 *   React "remonte" (bubbles up) l'erreur jusqu'au Error Boundary
 *   le plus proche.
 *
 *   error.tsx DOIT être un Client Component ("use client") car
 *   React Error Boundaries fonctionnent uniquement côté client.
 *
 * PROPS :
 * - error   → L'objet Error avec message et digest (hash)
 * - reset   → Fonction pour réessayer le rendu du composant
 *
 * COMPORTEMENT :
 * 1. Affiche un message d'erreur convivial
 * 2. Propose un bouton "Try Again" qui appelle reset()
 * 3. Propose un lien "Go Home" vers la page d'accueil
 */
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log l'erreur pour le debugging (en production, envoyer à un service comme Sentry)
    console.error("[RootErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            An unexpected error occurred. Please try again or go back to the home page.
          </p>
          {error.message && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-mono text-destructive break-all">
                {error.message}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
