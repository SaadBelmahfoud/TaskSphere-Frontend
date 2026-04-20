'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';
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

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string; label: string }> = {
  TODO: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'À faire' },
  DOING: { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'En cours' },
  DONE: { variant: 'default', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Terminé' },
};

const priorityConfig: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string; label: string }> = {
  LOW: { variant: 'outline', className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Basse' },
  MEDIUM: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Moyenne' },
  HIGH: { variant: 'outline', className: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Haute' },
  CRITICAL: { variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200', label: 'Critique' },
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

  /**
   * CORRECTION — Fonctionnalité d'assignation de tâche
   *
   * RBAC : Seuls ADMIN et MANAGER peuvent assigner des tâches.
   * Le bouton d'assignation n'est visible que pour ces rôles.
   *
   * FLUX :
   * 1. Saisir l'email de l'assignataire
   * 2. Cliquer "Assigner" → PATCH /tasks/{id}/assign { assigneeId: "email" }
   * 3. Le backend vérifie les permissions et l'existence de l'utilisateur
   * 4. Pour désassigner : cliquer "Retirer" avec un champ vide
   */
  const handleAssign = async () => {
    if (!assigneeEmail.trim()) {
      toast.error("Veuillez saisir l'email de l'assignataire");
      return;
    }
    try {
      await assignMutation.mutateAsync({ id, assigneeId: assigneeEmail.trim() });
      setAssigneeEmail('');
      toast.success('Tâche assignée avec succès');
    } catch {
      toast.error("Impossible d'assigner la tâche", {
        description: "Vérifiez que l'email est correct et que l'utilisateur existe",
      });
    }
  };

  const handleUnassign = async () => {
    try {
      await assignMutation.mutateAsync({ id, assigneeId: '' });
      toast.success('Assignation retirée');
    } catch {
      toast.error("Impossible de retirer l'assignation");
    }
  };

  // Vérifie si l'utilisateur courant est ADMIN ou MANAGER
  // On lit depuis localStorage car le rôle est stocké dans le state d'auth
  const currentUserRole = typeof window !== 'undefined'
    ? (() => {
        try {
          const stored = localStorage.getItem('tasksphere_auth');
          if (!stored) return 'USER';
          return JSON.parse(stored).role || 'USER';
        } catch { return 'USER'; }
      })()
    : 'USER';
  const canAssign = currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
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
            {isError ? 'Erreur lors du chargement' : 'Tâche non trouvée'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'La tâche demandée n\'existe pas ou vous n\'y avez pas accès.'}
          </p>
          <Button variant="outline" onClick={() => router.push('/tasks')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour aux tâches
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
        Retour aux tâches
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6">
            {isEditing ? (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Modifier la tâche</h2>
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
                    Modifier
                  </Button>
                </div>

                {task.description ? (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-4">Aucune description</p>
                )}
              </>
            )}
          </div>

          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Changer le statut</h2>
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
          {/* Détails */}
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Détails</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd className="text-foreground font-mono text-xs mt-0.5 break-all">{task.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Propriétaire (userId)</dt>
                <dd className="text-foreground font-mono text-xs mt-0.5 break-all">{task.userId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assignataire</dt>
                <dd className="text-foreground mt-0.5">
                  {task.assigneeId ? (
                    <Badge variant="secondary">{task.assigneeId}</Badge>
                  ) : (
                    <span className="text-muted-foreground italic">Non assignée</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Créée le</dt>
                <dd className="text-foreground mt-0.5">{formatDate(task.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Échéance</dt>
                <dd className="text-foreground mt-0.5">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
              {task.completedAt && (
                <div>
                  <dt className="text-muted-foreground">Terminée le</dt>
                  <dd className="text-foreground mt-0.5">{formatDate(task.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* CORRECTION — Section d'assignation (ADMIN/MANAGER uniquement) */}
          {canAssign && (
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" />
                Assignation
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                {task.assigneeId
                  ? `Cette tâche est assignée à ${task.assigneeId}`
                  : 'Cette tâche n\'est assignée à personne'}
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
                  Assigner
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
                  Retirer l&apos;assignation
                </Button>
              )}
            </div>
          )}

          {/* Zone de danger */}
          <div className="bg-card rounded-xl border border-destructive/50 shadow-sm p-6">
            <h2 className="text-sm font-medium text-destructive mb-2">Zone de danger</h2>
            <p className="text-xs text-muted-foreground mb-3">La suppression est irréversible (soft delete).</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDelete(true)}
              className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer cette tâche
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        title="Supprimer la tâche"
        message={`Voulez-vous vraiment supprimer "${task.title}" ?`}
        confirmLabel="Supprimer définitivement"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
}
