'use client';

import { useState } from 'react';
import { TaskCreateRequest, TaskUpdateRequest } from '@/types';

interface TaskFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    title: string;
    description: string;
    priority: string;
    dueDate: string | null;
  };
  onSubmit: (data: TaskCreateRequest | TaskUpdateRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function TaskForm({ mode, initialData, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState(initialData?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(initialData?.dueDate?.split('T')[0] || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    try {
      const data: TaskCreateRequest | TaskUpdateRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority: priority || undefined,
        dueDate: dueDate || undefined,
      };

      if (mode === 'create') {
        (data as TaskCreateRequest).title = title.trim();
      }

      await onSubmit(data);
      if (mode === 'create') {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setDueDate('');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const priorities = [
    { value: 'LOW', label: 'Basse', color: 'bg-slate-100 text-slate-600' },
    { value: 'MEDIUM', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'HIGH', label: 'Haute', color: 'bg-orange-100 text-orange-700' },
    { value: 'CRITICAL', label: 'Critique', color: 'bg-red-100 text-red-700' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={255}
          placeholder="Titre de la tâche"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="Description détaillée (optionnel)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
        <div className="flex gap-2 flex-wrap">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                priority === p.value
                  ? `${p.color} border-current ring-2 ring-offset-1 ring-gray-300`
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;échéance</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : mode === 'create' ? 'Créer la tâche' : 'Mettre à jour'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
