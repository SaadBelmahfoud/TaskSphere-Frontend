/**
 * ═══════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY : Register Route
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 1 : Error Boundary spécifique à l'inscription
 *
 * Ce boundary attrape les erreurs de la page /register :
 * - Erreur de rendu du formulaire
 * - Erreur inattendue (non liée à la validation)
 */
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RegisterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RegisterErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-xl border-coral/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-coral" />
          </div>
          <CardTitle className="text-xl">Registration Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Something went wrong during registration. Please try again.
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
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
