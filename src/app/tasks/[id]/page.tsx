'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import CommentsSection from '@/components/CommentsSection';
import {
  useTaskQuery,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
  useAssignTaskMutation,
} from '@/hooks/useTasks';
import { TaskUpdateRequest } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Pencil, Trash2, UserPlus, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { parseLocalDate } from '@/lib/utils';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string; label: string }> = {
  TODO: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'To Do' },
  DOING: { variant: 'outline', className: 'bg-sky-50 text-sky-700 border-sky-200', label: 'In Progress' },
  DONE: { variant: 'default', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Done' },
};

const priorityConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string; label: string }> = {
  LOW: { variant: 'outline', className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low' },
  MEDIUM: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Medium' },
  HIGH: { variant: 'outline', className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
  CRITICAL: { variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState('');

  const { data: task, isLoading, error, isError } = useTaskQuery(id);
  const updateMutation = useUpdateTaskMutation(id);
  const updateStatusMutation = useUpdateTaskStatusMutation();
  const deleteMutation = useDeleteTaskMutation();
  const assignMutation = useAssignTaskMutation();

  const handleUpdate = async (data: TaskUpdateRequest) => {
    await updateMutation.mutateAsync(data);
    setIsEditing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatusMutation.mutateAsync({ id, status: newStatus });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/tasks');
  };

  const handleAssign = async () => {
    if (!assigneeEmail.trim()) {
      toast.error('Please enter the assignee email');
      return;
    }
    try {
      await assignMutation.mutateAsync({ id, assigneeId: assigneeEmail.trim() });
      setAssigneeEmail('');
      toast.success('Task assigned successfully');
    } catch {
      toast.error('Unable to assign task', {
        description: 'Check that the email is correct and the user exists',
      });
    }
  };

  const handleUnassign = async () => {
    try {
      await assignMutation.mutateAsync({ id, assigneeId: '' });
      toast.success('Assignment removed');
    } catch {
      toast.error('Unable to remove assignment');
    }
  };

  const { auth: userAuth } = useAuth();
  const currentUserRole = userAuth.role || 'USER';
  const canAssign = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-7 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-card rounded-xl border shadow-sm p-6 space-y-3">
              <Skeleton className="h-4 w-16" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <div className="bg-card rounded-xl border border-destructive/50 shadow-sm p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !task) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-foreground mb-2">
            {isError ? 'Error loading task' : 'Task not found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'The requested task does not exist or you do not have access.'}
          </p>
          <Button variant="outline" onClick={() => router.push('/tasks')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to tasks
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[task.status] || statusConfig.TODO;
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')} className="mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to tasks
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            {isEditing ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Edit Task</h2>
                <TaskForm
                  mode="edit"
                  initialData={{
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    dueDate: task.dueDate,
                  }}
                  onSubmit={handleUpdate}
                  onCancel={() => setIsEditing(false)}
                  isLoading={updateMutation.isPending}
                />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground mb-2">{task.title}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                      <Badge variant={priority.variant} className={priority.className}>
                        {priority.label}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>

                {task.description ? (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-4">No description</p>
                )}
              </>
            )}
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Change Status</h2>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(key)}
                  disabled={task.status === key || updateStatusMutation.isPending}
                  className={`${task.status === key ? 'ring-2 ring-ring ring-offset-2 cursor-default' : ''} ${cfg.className}`}
                >
                  {cfg.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Details */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="text-foreground font-mono text-xs mt-0.5 break-all">{task.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Owner (userId)</dt>
                <dd className="text-foreground font-mono text-xs mt-0.5 break-all">{task.userId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assignee</dt>
                <dd className="text-foreground mt-0.5">
                  {task.assigneeId ? (
                    <Badge variant="secondary">{task.assigneeId}</Badge>
                  ) : (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground mt-0.5">{formatDate(task.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Due Date</dt>
                <dd className="text-foreground mt-0.5">
                  {task.dueDate
                    ? parseLocalDate(task.dueDate).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '\u2014'}
                </dd>
              </div>
              {task.completedAt && (
                <div>
                  <dt className="text-muted-foreground">Completed</dt>
                  <dd className="text-foreground mt-0.5">{formatDate(task.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Assignment section (ADMIN/MANAGER only) */}
          {canAssign && (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" />
                Assignment
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                {task.assigneeId
                  ? `This task is assigned to ${task.assigneeId}`
                  : 'This task is not assigned to anyone'}
              </p>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@tasksphere.com"
                  value={assigneeEmail}
                  onChange={(e) => setAssigneeEmail(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAssign}
                  disabled={assignMutation.isPending || !assigneeEmail.trim()}
                  className="shrink-0"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Assign
                </Button>
              </div>

              {task.assigneeId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnassign}
                  disabled={assignMutation.isPending}
                  className="w-full mt-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <UserX className="h-3.5 w-3.5 mr-1" />
                  Remove Assignment
                </Button>
              )}
            </div>
          )}

          {/* Danger zone */}
          <div className="bg-card rounded-xl border border-destructive/50 shadow-sm p-6">
            <h2 className="text-sm font-medium text-destructive mb-2">Danger Zone</h2>
            <p className="text-xs text-muted-foreground mb-3">Deletion is irreversible (soft delete).</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete this task
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete task"
        message={`Are you sure you want to delete "${task.title}"?`}
        confirmLabel="Delete permanently"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={deleteMutation.isPending}
      />

      <CommentsSection taskId={task.id} />
    </AppLayout>
  );
}
