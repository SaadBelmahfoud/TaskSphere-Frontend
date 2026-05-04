/**
 * ═══════════════════════════════════════════════════════════════════
 * SHARED MODULE : Task Configuration (DRY Principle)
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — Extraction des statusConfig / priorityConfig
 * PHASE 3 — Ajout de tagConfig, notificationConfig
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
// TAG CONFIGURATION (Phase 3)
// ═══════════════════════════════════════════════════════

export const DEFAULT_TAG_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
  "#8B5CF6", "#EC4899", "#14B8A6", "#6366F1",
  "#F97316", "#06B6D4", "#84CC16", "#E11D48",
];

// ═══════════════════════════════════════════════════════
// NOTIFICATION CONFIGURATION (Phase 3)
// ═══════════════════════════════════════════════════════

export const notificationTypeConfig: Record<string, {
  label: string;
  icon: string;
  color: string;
}> = {
  TASK_ASSIGNED: { label: "Task Assigned", icon: "UserPlus", color: "text-sky" },
  TASK_UNASSIGNED: { label: "Task Unassigned", icon: "UserMinus", color: "text-orange" },
  TASK_UPDATED: { label: "Task Updated", icon: "Pencil", color: "text-amber" },
  TASK_STATUS_CHANGED: { label: "Status Changed", icon: "ArrowRightLeft", color: "text-emerald" },
  TASK_DELETED: { label: "Task Deleted", icon: "Trash2", color: "text-coral" },
  COMMENT_ADDED: { label: "Comment Added", icon: "MessageSquare", color: "text-muted-foreground" },
  USER_ROLE_CHANGED: { label: "Role Changed", icon: "Shield", color: "text-primary" },
};

// ═══════════════════════════════════════════════════════
// CHART CONFIGURATIONS (Recharts)
// ═══════════════════════════════════════════════════════

export const statusChartConfig: ChartConfig = {
  TODO: { label: "To Do", color: "var(--muted-foreground)" },
  DOING: { label: "In Progress", color: "var(--sky)" },
  DONE: { label: "Done", color: "var(--emerald)" },
};

export const priorityChartConfig: ChartConfig = {
  LOW: { label: "Low", color: "var(--sky)" },
  MEDIUM: { label: "Medium", color: "var(--amber)" },
  HIGH: { label: "High", color: "var(--orange)" },
  CRITICAL: { label: "Critical", color: "var(--coral)" },
};

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
  UNASSIGNED: "bg-orange/10 text-orange",
};
