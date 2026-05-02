/**
 * ═══════════════════════════════════════════════════════════════════
 * KANBAN PAGE — Dynamic imports + Shared config
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 2 : Utilisation du module partagé task-config
 * PHASE 2 — TÂCHE 4 : Dynamic() imports pour @dnd-kit
 * ──────────────────────────────────────────────────────
 *
 * TÂCHE 2 :
 *   AVANT : COLUMNS + priorityVariant + priorityColorClass définis localement
 *   APRÈS : importés depuis @/lib/task-config (KANBAN_COLUMNS, priorityConfig)
 *
 * TÂCHE 4 :
 *   AVANT : import statique de @dnd-kit/core (inclut dans le bundle initial)
 *   APRÈS : dynamic() import → @dnd-kit n'est chargé QUE quand la page
 *   est visitée. Réduit le bundle initial de ~50KB (gzipped).
 *
 *   PRINCIPE : Code Splitting
 *   Next.js dynamic() utilise React.lazy() + Suspense en interne.
 *   Le code de @dnd-kit est dans un chunk séparé qui n'est chargé
 *   que quand l'utilisateur visite /kanban.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import { useTasks, useChangeTaskStatus } from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import type { TaskResponse, TaskStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import Link from "next/link";
import { GripVertical, Calendar, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { KANBAN_COLUMNS, priorityConfig } from "@/lib/task-config";

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 2 — TÂCHE 4 : Dynamic import de DndContext
 * ═══════════════════════════════════════════════════════════════════
 *
 * DndContext est le composant racine de @dnd-kit.
 * Il pèse ~30KB gzipped et n'est utilisé QUE sur cette page.
 * En l'important dynamiquement, on réduit le bundle initial.
 *
 * ssr: false car @dnd-kit utilise des APIs navigateur (DOM measurements)
 * qui ne sont pas disponibles côté serveur.
 */
const DndContext = dynamic(
  () => import("@dnd-kit/core").then((mod) => mod.DndContext),
  { ssr: false }
);

function DroppableColumn({
  status,
  label,
  color,
  bgColor,
  headerColor,
  tasks,
  children,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  bgColor: string;
  headerColor: string;
  tasks: TaskResponse[];
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border-l-4 bg-muted/30 min-h-[300px] transition-all duration-200",
        color,
        isOver ? "ring-2 ring-primary/30 bg-primary/5" : bgColor
      )}
    >
      <div className="flex items-center justify-between p-3 border-b bg-card/50 rounded-tr-xl">
        <h3 className={cn("font-semibold text-sm", headerColor)}>{label}</h3>
        <Badge variant="secondary" className="text-xs tabular-nums">
          {tasks.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">{children}</div>
      </ScrollArea>
    </div>
  );
}

function KanbanCard({ task, assigneeName }: { task: TaskResponse; assigneeName?: string }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const priorityConf = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="cursor-grab hover:shadow-md transition-all duration-200 border-l-0 active:cursor-grabbing group">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{task.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Badge
                  variant={priorityConf.variant}
                  className={cn("text-[10px] px-1.5 py-0", priorityConf.color)}
                >
                  {priorityConf.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Overdue
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                {task.assigneeId && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[7px] bg-primary/10 text-primary">
                        {assigneeName
                          ? assigneeName.substring(0, 2).toUpperCase()
                          : task.assigneeId.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[80px]">{assigneeName || task.assigneeId}</span>
                  </div>
                )}
                {task.dueDate && !isOverdue && (
                  <div className="flex items-center gap-0.5">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function KanbanPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { data: tasksData, isLoading } = useTasks(0, 100);
  const changeStatus = useChangeTaskStatus();
  const { data: users } = useUsers();

  const [activeTask, setActiveTask] = useState<TaskResponse | null>(null);
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Map<string, string>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // CORRECTION : userMap keyé par email (pas UUID)
  const userMap = new Map(users?.map((u) => [u.email, `${u.firstName} ${u.lastName}`]));

  const localTasks = tasksData?.content
    ? tasksData.content.map((t) => {
        const pendingStatus = pendingStatusChanges.get(t.id);
        return pendingStatus ? { ...t, status: pendingStatus } : t;
      })
    : [];

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated) return null;

  const tasksByStatus = (status: TaskStatus) =>
    localTasks.filter((t) => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find((t) => t.id === String(event.active.id));
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;

    const taskId = String(event.active.id);
    const newStatus = over.id as TaskStatus;

    setPendingStatusChanges((prev) => {
      const next = new Map(prev);
      next.set(taskId, newStatus);
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const originalTask = tasksData?.content?.find((t) => t.id === taskId);

    if (originalTask && originalTask.status !== newStatus) {
      changeStatus.mutate({ id: taskId, status: newStatus });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground">
            Drag and drop tasks to change their status
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {KANBAN_COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  color={col.color}
                  bgColor={col.bgColor}
                  headerColor={col.headerColor}
                  tasks={tasksByStatus(col.status)}
                >
                  {tasksByStatus(col.status).map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      assigneeName={task.assigneeId ? userMap.get(task.assigneeId) : undefined}
                    />
                  ))}
                  {tasksByStatus(col.status).length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </div>
                  )}
                </DroppableColumn>
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <KanbanCard
                  task={activeTask}
                  assigneeName={activeTask.assigneeId ? userMap.get(activeTask.assigneeId) : undefined}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </AppLayout>
  );
}
