/**
 * ═══════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY : Tasks List Route
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 1 : Error Boundary spécifique à la liste des tâches
 *
 * Ce boundary attrape les erreurs de la page /tasks uniquement :
 * - Erreur de chargement des tâches (API down)
 * - Erreur de recherche/filtrage
 * - Erreur de création de tâche
 */
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TasksErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-coral/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center">
            <ListTodo className="h-8 w-8 text-coral" />
          </div>
          <CardTitle className="text-xl">Tasks Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Failed to load tasks. Please try again.
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
            Retry
          </Button>
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
