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
import type { TaskStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

  const [assigneeId, setAssigneeId] = useState("");
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

  const handleAssign = () => {
    if (!assigneeId.trim()) {
      toast.error("Please enter an assignee ID");
      return;
    }
    assignTask.mutate(
      { id: taskId, data: { assigneeId: assigneeId.trim() } },
      {
        onSuccess: () => setAssigneeId(""),
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
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Task not found</p>
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/tasks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusVariant[task.status] || "outline"}>
                  {statusLabel[task.status] || task.status}
                </Badge>
                <Badge variant="outline">{task.priority}</Badge>
              </div>
            </div>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
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
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Status change */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(["TODO", "DOING", "DONE"] as TaskStatus[]).map((s) => (
                    <Button
                      key={s}
                      variant={task.status === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(s)}
                      disabled={changeStatus.isPending || task.status === s}
                    >
                      {statusLabel[s]}
                    </Button>
                  ))}
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
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Description</p>
                      <p className="mt-1 text-sm whitespace-pre-wrap">
                        {task.description || "No description"}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Owner ID</p>
                        <p className="mt-1 text-sm font-mono text-xs">{task.userId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                        <p className="mt-1 text-sm">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString()
                            : "No due date"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Created</p>
                        <p className="mt-1 text-sm">
                          {task.createdAt
                            ? new Date(task.createdAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <p className="mt-1 text-sm">
                          {task.completedAt
                            ? new Date(task.completedAt).toLocaleString()
                            : "Not yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assign section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assignee</CardTitle>
              </CardHeader>
              <CardContent>
                {task.assigneeId ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{task.assigneeId}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnassign}
                      disabled={assignTask.isPending}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unassign
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Assignee ID (UUID)"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      size="sm"
                      onClick={handleAssign}
                      disabled={assignTask.isPending}
                    >
                      {assignTask.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Assign
                    </Button>
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
