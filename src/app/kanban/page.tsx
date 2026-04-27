"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import { useTasks, useChangeTaskStatus } from "@/hooks/useTasks";
import type { TaskResponse, TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
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
import { GripVertical } from "lucide-react";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "TODO", label: "To Do", color: "border-l-chart-1" },
  { status: "DOING", label: "In Progress", color: "border-l-chart-2" },
  { status: "DONE", label: "Done", color: "border-l-chart-3" },
];

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  CRITICAL: "destructive",
};

function DroppableColumn({
  status,
  label,
  color,
  tasks,
  children,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: TaskResponse[];
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border-l-4 ${color} bg-muted/30 min-h-[200px] ${
        isOver ? "ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">{children}</div>
      </ScrollArea>
    </div>
  );
}

function KanbanCard({ task }: { task: TaskResponse }) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="cursor-grab hover:shadow-md transition-shadow border-l-0 active:cursor-grabbing">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1">{task.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge
                  variant={priorityVariant[task.priority] || "outline"}
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
              </div>
              {task.assigneeId && (
                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                  → {task.assigneeId}
                </p>
              )}
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

  const [activeTask, setActiveTask] = useState<TaskResponse | null>(null);
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Map<string, string>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
              <Skeleton key={i} className="h-96 rounded-lg" />
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
              {COLUMNS.map((col) => (
                <DroppableColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  color={col.color}
                  tasks={tasksByStatus(col.status)}
                >
                  {tasksByStatus(col.status).map((task) => (
                    <KanbanCard key={task.id} task={task} />
                  ))}
                  {tasksByStatus(col.status).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks
                    </p>
                  )}
                </DroppableColumn>
              ))}
            </div>

            <DragOverlay>
              {activeTask && <KanbanCard task={activeTask} />}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </AppLayout>
  );
}
