'use client';

import { TaskResponse } from '@/types';

interface TaskCardProps {
  task: TaskResponse;
  onView: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  TODO: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'À faire' },
  DOING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En cours' },
  DONE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Terminé' },
};

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Basse' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Moyenne' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Haute' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critique' },
};

export default function TaskCard({ task, onView, onStatusChange, onDelete }: TaskCardProps) {
  const status = statusConfig[task.status] || statusConfig.TODO;
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  const nextStatus = task.status === 'TODO' ? 'DOING' : task.status === 'DOING' ? 'DONE' : null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <button onClick={() => onView(task.id)} className="text-left flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate hover:text-emerald-600 transition-colors">
              {task.title}
            </h3>
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Badges + Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            {task.dueDate && (
              <span className="text-xs text-gray-400">
                📅 {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50 rounded-b-lg">
        <button
          onClick={() => onView(task.id)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Voir détails
        </button>
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button
              onClick={() => onStatusChange(task.id, nextStatus)}
              className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
            >
              → {statusConfig[nextStatus].label}
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
