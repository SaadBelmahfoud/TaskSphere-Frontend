/**
 * ═══════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY : Task Detail Route (/tasks/[id])
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 1 : Error Boundary spécifique au détail d'une tâche
 *
 * Ce boundary attrape les erreurs de la page /tasks/[id] :
 * - Erreur de chargement de la tâche (ID invalide, API down)
 * - Erreur de mise à jour/suppression
 * - Erreur de la section commentaires
 * - Erreur d'assignation
 */
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TaskDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TaskDetailErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-coral/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center">
            <FileWarning className="h-8 w-8 text-coral" />
          </div>
          <CardTitle className="text-xl">Task Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Failed to load this task. It may not exist or a server error occurred.
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
          <Link href="/tasks" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
