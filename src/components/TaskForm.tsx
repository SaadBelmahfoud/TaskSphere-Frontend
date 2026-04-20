'use client';

import { useState } from 'react';
import { TaskCreateRequest, TaskUpdateRequest } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

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

      await onSubmit(data);
      if (mode === 'create') {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setDueDate('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(message);
    }
  };

  const priorities = [
    { value: 'LOW', label: 'Basse', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'MEDIUM', label: 'Moyenne', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'HIGH', label: 'Haute', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'CRITICAL', label: 'Critique', className: 'bg-red-100 text-red-700 border-red-200' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="task-title">Titre *</Label>
        <Input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={255}
          placeholder="Titre de la tâche"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          rows={3}
          placeholder="Description détaillée (optionnel)"
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Priorité</Label>
        <div className="flex gap-2 flex-wrap">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                priority === p.value
                  ? `${p.className} ring-2 ring-ring ring-offset-2`
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-date">Date d&apos;échéance</Label>
        <Input
          id="task-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement...</>
          ) : mode === 'create' ? (
            'Créer la tâche'
          ) : (
            'Mettre à jour'
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
