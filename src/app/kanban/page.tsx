"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { GripVertical, Calendar, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const COLUMNS: { status: TaskStatus; label: string; color: string; bgColor: string; headerColor: string }[] = [
  { status: "TODO", label: "To Do", color: "border-l-muted-foreground", bgColor: "bg-muted/30", headerColor: "text-muted-foreground" },
  { status: "DOING", label: "In Progress", color: "border-l-sky", bgColor: "bg-muted/30", headerColor: "text-sky" },
  { status: "DONE", label: "Done", color: "border-l-emerald", bgColor: "bg-muted/30", headerColor: "text-emerald" },
];

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  CRITICAL: "destructive",
};

const priorityColorClass: Record<string, string> = {
  LOW: "bg-sky/10 text-sky",
  MEDIUM: "bg-amber/15 text-amber",
  HIGH: "bg-orange/15 text-orange",
  CRITICAL: "bg-coral/15 text-coral",
};

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
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const dragStyle = transform
    ? { transform: CSS.Transform.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={dragStyle} className="group">
      <Link href={`/tasks/${task.id}`}>
        <Card className="hover:shadow-md transition-all duration-200 border-l-0 active:cursor-grabbing">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <GripVertical
                className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
                {...listeners}
                {...attributes}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{task.title}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <Badge
                    variant={priorityVariant[task.priority] || "outline"}
                    className={cn("text-[10px] px-1.5 py-0", priorityColorClass[task.priority] || "")}
                  >
                    {task.priority}
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
    </div>
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
  // car task.assigneeId stocke un email dans le backend
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
              {COLUMNS.map((col) => (
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
