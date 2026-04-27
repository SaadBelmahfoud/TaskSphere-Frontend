"use client";

import Link from "next/link";
import type { TaskResponse, TaskStatus, TaskPriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, UserCircle } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  TODO: "outline",
  DOING: "secondary",
  DONE: "default",
};

const statusLabel: Record<string, string> = {
  TODO: "To Do",
  DOING: "In Progress",
  DONE: "Done",
};

const priorityVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  CRITICAL: "destructive",
};

interface TaskCardProps {
  task: TaskResponse;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-1">{task.title}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={statusVariant[task.status] || "outline"} className="text-xs">
                {statusLabel[task.status] || task.status}
              </Badge>
              <Badge variant={priorityVariant[task.priority] || "outline"} className="text-xs">
                {task.priority}
              </Badge>
            </div>
          </div>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {task.assigneeId && (
              <div className="flex items-center gap-1">
                <UserCircle className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{task.assigneeId}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
