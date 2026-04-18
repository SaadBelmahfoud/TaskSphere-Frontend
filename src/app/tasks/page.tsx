'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getMyTasks, createTask, updateTaskStatus, deleteTask } from '@/hooks/useTasks';
import { TaskResponse, TaskCreateRequest, TaskPageResponse } from '@/types';
import { useRouter } from 'next/navigation';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0, number: 0, size: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const loadTasks = useCallback(async (page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const data: TaskPageResponse = await getMyTasks(page, 20);
      setTasks(data.content);
      setPageInfo({
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        number: data.number,
        size: data.size,
      });
      setCurrentPage(data.number);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 401) return;
      setError('Erreur lors du chargement des tâches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreate = async (data: TaskCreateRequest) => {
    setIsCreating(true);
    try {
      await createTask(data as TaskCreateRequest);
      setShowCreateForm(false);
      await loadTasks(0);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateTaskStatus(id, status);
      await loadTasks(currentPage);
    } catch {
      setError('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteTask(deleteId);
      setDeleteId(null);
      await loadTasks(currentPage);
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Tâches</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pageInfo.totalElements} tâche{pageInfo.totalElements !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
        >
          {showCreateForm ? '✕ Annuler' : '+ Nouvelle tâche'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle tâche</h2>
          <TaskForm mode="create" onSubmit={handleCreate} isLoading={isCreating} />
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
          <p className="text-sm text-gray-500">Créez votre première tâche pour commencer !</p>
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

          {/* Pagination */}
          {pageInfo.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => loadTasks(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-500">
                Page {currentPage + 1} / {pageInfo.totalPages}
              </span>
              <button
                onClick={() => loadTasks(currentPage + 1)}
                disabled={currentPage >= pageInfo.totalPages - 1}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Supprimer la tâche"
        message="Cette action est irréversible. La tâche sera archivée (soft delete)."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
