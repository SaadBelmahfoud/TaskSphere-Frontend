'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useMyTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from '@/hooks/useTasks';
import { TaskCreateRequest, TaskUpdateRequest } from '@/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, X, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';

export default function TasksPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: taskPage, isLoading } = useMyTasksQuery(currentPage, 20);
  const createMutation = useCreateTaskMutation();
  const updateStatusMutation = useUpdateTaskStatusMutation();
  const deleteMutation = useDeleteTaskMutation();

  const tasks = taskPage?.content ?? [];
  const totalPages = taskPage?.totalPages ?? 0;
  const totalElements = taskPage?.totalElements ?? 0;

  const router = useRouter();

  const handleCreate = async (data: TaskCreateRequest | TaskUpdateRequest) => {
    await createMutation.mutateAsync(data as TaskCreateRequest);
    setShowCreateForm(false);
    setCurrentPage(0);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Mes Tâches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalElements} tâche{totalElements !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? 'outline' : 'default'}
          size="sm"
        >
          {showCreateForm ? <><X className="h-4 w-4 mr-1" /> Annuler</> : <><Plus className="h-4 w-4 mr-1" /> Nouvelle tâche</>}
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-card rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Nouvelle tâche</h2>
          <TaskForm mode="create" onSubmit={handleCreate} isLoading={createMutation.isPending} />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center justify-between pt-3 border-t">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune tâche</h3>
          <p className="text-sm text-muted-foreground">Créez votre première tâche pour commencer !</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onView={(id) => router.push(`/tasks/${id}`)}
                onStatusChange={handleStatusChange}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Supprimer la tâche"
        message="Cette action est irréversible. La tâche sera archivée (soft delete)."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
}
