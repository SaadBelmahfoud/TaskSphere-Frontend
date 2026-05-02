/**
 * ═══════════════════════════════════════════════════════════════════
 * SHARED MODULE : Task Configuration (DRY Principle)
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 2 : Extraction des statusConfig / priorityConfig
 * ─────────────────────────────────────────────────────────────────
 *
 * PROBLÈME AVANT :
 *   Les configurations de statut et de priorité étaient dupliquées
 *   dans CHAQUE composant qui en avait besoin :
 *   - TaskCard.tsx       → statusConfig + priorityConfig (locales)
 *   - TaskForm.tsx       → priorityConfig (locale)
 *   - tasks/[id]/page.tsx → statusConfig + priorityConfig (locales)
 *   - kanban/page.tsx    → COLUMNS + priorityVariant + priorityColorClass (locales)
 *   - dashboard/page.tsx → statusChartConfig + priorityChartConfig + STATUS_COLORS + PRIORITY_COLORS (locales)
 *
 *   PRINCIPE VIOLÉ : DRY (Don't Repeat Yourself)
 *   Si on change la couleur d'un statut ou d'une priorité,
 *   il faut le modifier dans 5 fichiers → risque d'incohérence.
 *
 * SOLUTION APRÈS :
 *   Ce module centralise TOUTES les configurations liées aux tâches.
 *   Chaque composant importe depuis ce module unique.
 *   → Un seul endroit à modifier = zéro risque d'incohérence.
 *
 * STRUCTURE :
 * ┌────────────────────────────────────────────────────────────────┐
 * │  statusConfig    → Labels, variants, couleurs des statuts     │
 * │  priorityConfig  → Labels, variants, couleurs des priorités   │
 * │  statusChartConfig   → Config recharts pour PieChart statuts  │
 * │  priorityChartConfig → Config recharts pour BarChart priorités│
 * │  STATUS_COLORS   → Couleurs CSS pour les Cell recharts        │
 * │  PRIORITY_COLORS → Couleurs CSS pour les Cell recharts        │
 * │  KANBAN_COLUMNS  → Config colonnes Kanban Board               │
 * │  roleConfig      → Config badges rôles (admin panel)          │
 * │  actionColors    → Config badges activités (dashboard)         │
 * └────────────────────────────────────────────────────────────────┘
 */

import type { ChartConfig } from "@/components/ui/chart";
import type { TaskStatus } from "@/types";
import {
  Circle,
  Timer,
  CheckCircle2,
} from "lucide-react";

// ═══════════════════════════════════════════════════════
// STATUS CONFIGURATION
// ═══════════════════════════════════════════════════════

/**
 * Configuration des statuts de tâches.
 *
 * UTILISÉ PAR : TaskCard, tasks/[id]/page, kanban/page
 *
 * PROPERTIES :
 * - label     → Texte affiché dans les badges/boutons
 * - variant   → Variante shadcn/ui Badge pour le style
 * - icon      → Icône Lucide représentant le statut
 * - color     → Classe Tailwind pour la couleur du texte
 * - dotColor  → Classe Tailwind pour le point coloré (TaskCard)
 * - headerColor → Classe Tailwind pour l'en-tête Kanban
 * - borderClass → Classe Tailwind pour la bordure gauche Kanban
 * - bgClass     → Classe Tailwind pour le fond Kanban
 */
export const statusConfig: Record<string, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Circle;
  color: string;
  dotColor: string;
  headerColor: string;
  borderClass: string;
  bgClass: string;
}> = {
  TODO: {
    label: "To Do",
    variant: "outline",
    icon: Circle,
    color: "text-muted-foreground",
    dotColor: "bg-muted-foreground",
    headerColor: "text-muted-foreground",
    borderClass: "border-l-muted-foreground",
    bgClass: "bg-muted/30",
  },
  DOING: {
    label: "In Progress",
    variant: "secondary",
    icon: Timer,
    color: "text-primary",
    dotColor: "bg-primary",
    headerColor: "text-sky",
    borderClass: "border-l-sky",
    bgClass: "bg-muted/30",
  },
  DONE: {
    label: "Done",
    variant: "default",
    icon: CheckCircle2,
    color: "text-primary",
    dotColor: "bg-primary",
    headerColor: "text-emerald",
    borderClass: "border-l-emerald",
    bgClass: "bg-muted/30",
  },
};

// ═══════════════════════════════════════════════════════
// PRIORITY CONFIGURATION
// ═══════════════════════════════════════════════════════

/**
 * Configuration des priorités de tâches.
 *
 * UTILISÉ PAR : TaskCard, TaskForm, tasks/[id]/page, kanban/page
 *
 * PROPERTIES :
 * - label     → Texte affiché dans les badges/boutons
 * - variant   → Variante shadcn/ui Badge
 * - color     → Classe Tailwind pour le fond + texte du badge
 */
export const priorityConfig: Record<string, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
}> = {
  LOW: { label: "Low", variant: "outline", color: "bg-sky/10 text-sky" },
  MEDIUM: { label: "Medium", variant: "secondary", color: "bg-amber/15 text-amber" },
  HIGH: { label: "High", variant: "default", color: "bg-orange/15 text-orange" },
  CRITICAL: { label: "Critical", variant: "destructive", color: "bg-coral/15 text-coral" },
};

// ═══════════════════════════════════════════════════════
// CHART CONFIGURATIONS (Recharts)
// ═══════════════════════════════════════════════════════

/**
 * Configuration du PieChart "Tasks by Status".
 * UTILISÉ PAR : dashboard/page.tsx
 */
export const statusChartConfig: ChartConfig = {
  TODO: { label: "To Do", color: "var(--muted-foreground)" },
  DOING: { label: "In Progress", color: "var(--sky)" },
  DONE: { label: "Done", color: "var(--emerald)" },
};

/**
 * Configuration du BarChart "Tasks by Priority".
 * UTILISÉ PAR : dashboard/page.tsx
 */
export const priorityChartConfig: ChartConfig = {
  LOW: { label: "Low", color: "var(--sky)" },
  MEDIUM: { label: "Medium", color: "var(--amber)" },
  HIGH: { label: "High", color: "var(--orange)" },
  CRITICAL: { label: "Critical", color: "var(--coral)" },
};

// ═══════════════════════════════════════════════════════
// CHART COLORS (CSS Variables for Recharts Cells)
// ═══════════════════════════════════════════════════════

export const STATUS_COLORS: Record<string, string> = {
  TODO: "var(--color-muted-foreground)",
  DOING: "var(--color-sky)",
  DONE: "var(--color-emerald)",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "var(--color-sky)",
  MEDIUM: "var(--color-amber)",
  HIGH: "var(--color-orange)",
  CRITICAL: "var(--color-coral)",
};

// ═══════════════════════════════════════════════════════
// KANBAN COLUMNS
// ═══════════════════════════════════════════════════════

/**
 * Configuration des colonnes du Kanban Board.
 * UTILISÉ PAR : kanban/page.tsx
 */
export const KANBAN_COLUMNS: {
  status: TaskStatus;
  label: string;
  color: string;
  bgColor: string;
  headerColor: string;
}[] = [
  { status: "TODO", label: "To Do", color: "border-l-muted-foreground", bgColor: "bg-muted/30", headerColor: "text-muted-foreground" },
  { status: "DOING", label: "In Progress", color: "border-l-sky", bgColor: "bg-muted/30", headerColor: "text-sky" },
  { status: "DONE", label: "Done", color: "border-l-emerald", bgColor: "bg-muted/30", headerColor: "text-emerald" },
];

// ═══════════════════════════════════════════════════════
// ROLE CONFIGURATION (Admin Panel)
// ═══════════════════════════════════════════════════════

/**
 * Configuration des badges de rôle utilisateur.
 * UTILISÉ PAR : admin/page.tsx
 */
export const roleConfig: Record<string, {
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
}> = {
  ADMIN: { variant: "default", color: "bg-primary/10 text-primary" },
  MANAGER: { variant: "secondary", color: "bg-sky/10 text-sky" },
  USER: { variant: "outline", color: "bg-muted text-muted-foreground" },
};

// ═══════════════════════════════════════════════════════
// ACTION COLORS (Activity Log)
// ═══════════════════════════════════════════════════════

/**
 * Configuration des badges d'action pour l'Activity Log.
 * UTILISÉ PAR : dashboard/page.tsx
 */
export const actionBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "default",
  UPDATED: "secondary",
  STATUS_CHANGED: "outline",
  DELETED: "destructive",
  COMMENTED: "secondary",
  ASSIGNED: "outline",
};

export const actionColors: Record<string, string> = {
  CREATED: "bg-sky/10 text-sky",
  UPDATED: "bg-amber/10 text-amber",
  STATUS_CHANGED: "bg-emerald/10 text-emerald",
  DELETED: "bg-coral/10 text-coral",
  COMMENTED: "bg-muted text-muted-foreground",
  ASSIGNED: "bg-orange/10 text-orange",
};
