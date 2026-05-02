/**
 * ═══════════════════════════════════════════════════════════════════
 * ERROR BOUNDARY : Kanban Route
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 1 : Error Boundary spécifique au Kanban Board
 *
 * Ce boundary attrape les erreurs du Kanban uniquement :
 * - Erreur de chargement des tâches
 * - Erreur du drag & drop (@dnd-kit)
 * - Erreur de changement de statut
 */
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Columns3, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function KanbanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[KanbanErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-sky/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-sky/10 flex items-center justify-center">
            <Columns3 className="h-8 w-8 text-sky" />
          </div>
          <CardTitle className="text-xl">Kanban Board Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Failed to load the Kanban board. Please try again.
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
              Go to Tasks
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
