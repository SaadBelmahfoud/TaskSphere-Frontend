'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getTaskById, updateTask, updateTaskStatus, deleteTask } from '@/hooks/useTasks';
import { TaskResponse, TaskUpdateRequest } from '@/types';

const statusConfig: Record<string, { bg: string; text: string; label: string; next: string | null }> = {
  TODO: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'À faire', next: 'DOING' },
  DOING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En cours', next: 'DONE' },
  DONE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Terminé', next: null },
};

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Basse' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Moyenne' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Haute' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critique' },
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [task, setTask] = useState<TaskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTask = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTaskById(id);
      setTask(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      if (axiosErr?.response?.status === 404 || axiosErr?.response?.status === 401) {
        setError(axiosErr?.response?.data?.message || 'Tâche non trouvée');
      } else {
        setError('Erreur lors du chargement');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleUpdate = async (data: TaskUpdateRequest) => {
    setIsSaving(true);
    try {
      const updated = await updateTask(id, data);
      setTask(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await updateTaskStatus(id, newStatus);
      setTask(updated);
    } catch {
      setError('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(id);
      router.push('/tasks');
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

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
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error && !task) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/tasks')}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Retour aux tâches
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!task) return null;

  const status = statusConfig[task.status] || statusConfig.TODO;
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <AppLayout>
      {/* Back button */}
      <button
        onClick={() => router.push('/tasks')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-flex items-center gap-1"
      >
        ← Retour aux tâches
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium">✕</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            {isEditing ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Modifier la tâche</h2>
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
                  isLoading={isSaving}
                />
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
                        {priority.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                </div>

                {task.description ? (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-4">Aucune description</p>
                )}
              </>
            )}
          </div>

          {/* Status Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Changer le statut</h2>
            <div className="flex gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={task.status === key}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    task.status === key
                      ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-gray-300 cursor-default`
                      : `${cfg.bg} ${cfg.text} hover:opacity-80`
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-4">Détails</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-400">ID</dt>
                <dd className="text-gray-700 font-mono text-xs mt-0.5 break-all">{task.id}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Propriétaire (userId)</dt>
                <dd className="text-gray-700 font-mono text-xs mt-0.5 break-all">{task.userId}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Créée le</dt>
                <dd className="text-gray-700 mt-0.5">{formatDate(task.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Échéance</dt>
                <dd className="text-gray-700 mt-0.5">
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
                  <dt className="text-gray-400">Terminée le</dt>
                  <dd className="text-gray-700 mt-0.5">{formatDate(task.completedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-red-600 mb-2">Zone de danger</h2>
            <p className="text-xs text-gray-500 mb-3">La suppression est irréversible (soft delete).</p>
            <button
              onClick={() => setShowDelete(true)}
              className="w-full px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Supprimer cette tâche
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDelete}
        title="Supprimer la tâche"
        message={`Voulez-vous vraiment supprimer "${task.title}" ?`}
        confirmLabel="Supprimer définitivement"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
