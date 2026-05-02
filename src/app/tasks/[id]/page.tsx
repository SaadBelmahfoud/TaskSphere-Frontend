"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import TaskForm from "@/components/TaskForm";
import CommentsSection from "@/components/CommentsSection";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useChangeTaskStatus,
  useAssignTask,
} from "@/hooks/useTasks";
import { useUsers } from "@/hooks/useUsers";
import type { TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowLeft,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Timer,
  ChevronsUpDown,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { statusConfig, priorityConfig } from "@/lib/task-config";

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 2 — TÂCHE 2 : Utilisation du module partagé task-config
 * ═══════════════════════════════════════════════════════════════════
 *
 * AVANT : statusConfig + priorityConfig définis localement (12 lignes)
 * APRÈS : importés depuis @/lib/task-config
 * ═══════════════════════════════════════════════════════════════════
 */

export default function TaskDetailPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const changeStatus = useChangeTaskStatus();
  const assignTask = useAssignTask();
  const { data: users } = useUsers();

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated) return null;

  const handleUpdate = (data: Record<string, unknown>) => {
    updateTask.mutate(
      { id: taskId, data: data as Parameters<typeof updateTask.mutate>[0]["data"] },
      {
        onSuccess: () => setEditing(false),
      }
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(taskId, {
      onSuccess: () => router.push("/tasks"),
    });
  };

  const handleStatusChange = (status: TaskStatus) => {
    changeStatus.mutate({ id: taskId, status });
  };

  // CORRECTION : Envoyer user.email (pas user.id) comme assigneeId
  const handleAssign = (userEmail: string) => {
    assignTask.mutate(
      { id: taskId, data: { assigneeId: userEmail } },
      {
        onSuccess: () => setAssigneeOpen(false),
      }
    );
  };

  const handleUnassign = () => {
    assignTask.mutate({ id: taskId, data: { assigneeId: "" } });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Task not found</p>
          <Link href="/tasks">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const statusConf = statusConfig[task.status] || statusConfig.TODO;
  const priorityConf = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const StatusIcon = statusConf.icon;
  // CORRECTION : Chercher par email (pas UUID) car task.assigneeId est un email
  const assigneeUser = users?.find((u) => u.email === task.assigneeId);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/tasks">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight truncate">{task.title}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant={statusConf.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusConf.label}
                </Badge>
                <Badge variant={priorityConf.variant} className={cn("gap-1", priorityConf.color)}>
                  {priorityConf.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm" className="shrink-0">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            }
            title="Delete Task"
            description="Are you sure you want to delete this task? This action cannot be undone."
            onConfirm={handleDelete}
            confirmText="Delete"
            variant="destructive"
          />
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Status change */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", statusConf.color)} />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(["TODO", "DOING", "DONE"] as TaskStatus[]).map((s) => {
                    const conf = statusConfig[s];
                    const Icon = conf.icon;
                    return (
                      <Button
                        key={s}
                        variant={task.status === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusChange(s)}
                        disabled={changeStatus.isPending || task.status === s}
                        className="gap-1.5"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {conf.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Task form / details */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  {editing ? "Edit Task" : "Task Details"}
                </CardTitle>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editing ? (
                  <TaskForm
                    mode="edit"
                    task={task}
                    onSubmit={handleUpdate}
                    loading={updateTask.isPending}
                  />
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/50 rounded-lg p-3">
                        {task.description || "No description"}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Due Date</p>
                          <p className="text-sm mt-0.5">
                            {task.dueDate
                              ? format(new Date(task.dueDate), "MMM d, yyyy")
                              : "No due date"}
                          </p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Created</p>
                          <p className="text-sm mt-0.5">
                            {task.createdAt
                              ? format(new Date(task.createdAt), "MMM d, yyyy HH:mm")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {task.completedAt && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-primary">Completed</p>
                            <p className="text-sm mt-0.5">
                              {format(new Date(task.completedAt), "MMM d, yyyy HH:mm")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign section with user dropdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Assignee
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task.assigneeId ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {assigneeUser
                            ? `${assigneeUser.firstName?.[0]?.toUpperCase() || ""}${assigneeUser.lastName?.[0]?.toUpperCase() || ""}`
                            : task.assigneeId.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {assigneeUser
                            ? `${assigneeUser.firstName} ${assigneeUser.lastName}`
                            : "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assigneeUser?.email || task.assigneeId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnassign}
                      disabled={assignTask.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unassign
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={assigneeOpen}
                          className="flex-1 justify-between font-normal"
                          disabled={assignTask.isPending}
                        >
                          <span className="text-muted-foreground flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Select a user to assign...
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search users by name or email..." />
                          <CommandList>
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              {users
                                ?.filter((u) => u.enabled)
                                .map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.firstName} ${user.lastName} ${user.email} ${user.username}`}
                                    onSelect={() => handleAssign(user.email)}
                                    className="cursor-pointer"
                                  >
                                    <Avatar className="h-6 w-6 mr-2">
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {user.firstName} {user.lastName}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] shrink-0 ml-1">
                                      {user.role}
                                    </Badge>
                                    <Check className="ml-auto h-4 w-4 opacity-0" />
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {assignTask.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsSection taskId={taskId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
