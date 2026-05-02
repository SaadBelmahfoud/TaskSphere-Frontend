"use client";

import Link from "next/link";
import type { TaskResponse, TaskStatus, TaskPriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, UserCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dotColor: string }> = {
  TODO: { label: "To Do", variant: "outline", dotColor: "bg-muted-foreground" },
  DOING: { label: "In Progress", variant: "secondary", dotColor: "bg-primary" },
  DONE: { label: "Done", variant: "default", dotColor: "bg-primary" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  LOW: { label: "Low", variant: "outline", color: "bg-sky/10 text-sky" },
  MEDIUM: { label: "Medium", variant: "secondary", color: "bg-amber/15 text-amber" },
  HIGH: { label: "High", variant: "default", color: "bg-orange/15 text-orange" },
  CRITICAL: { label: "Critical", variant: "destructive", color: "bg-coral/15 text-coral" },
};

interface TaskCardProps {
  task: TaskResponse;
  assigneeName?: string;
}

export default function TaskCard({ task, assigneeName }: TaskCardProps) {
  const statusConf = statusConfig[task.status] || statusConfig.TODO;
  const priorityConf = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group">
        <CardContent className="p-4">
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {task.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={statusConf.variant} className="text-[10px] gap-1 px-1.5 py-0">
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full", statusConf.dotColor)} />
                {statusConf.label}
              </Badge>
              <Badge variant={priorityConf.variant} className={cn("text-[10px] px-1.5 py-0", priorityConf.color)}>
                {priorityConf.label}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {task.assigneeId && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                    {assigneeName
                      ? assigneeName.substring(0, 2).toUpperCase()
                      : task.assigneeId.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[100px]">
                  {assigneeName || task.assigneeId}
                </span>
              </div>
            )}
            {task.dueDate && (
              <div className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                {isOverdue ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {task.createdAt && (
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
