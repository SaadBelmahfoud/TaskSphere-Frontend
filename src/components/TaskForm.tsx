'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskCreateRequest, TaskUpdateRequest } from '@/types';
import { taskCreateSchema, taskUpdateSchema, TaskCreateFormData, TaskUpdateFormData } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

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
  const isCreate = mode === 'create';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskCreateFormData | TaskUpdateFormData>({
    resolver: zodResolver(isCreate ? taskCreateSchema : taskUpdateSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: (initialData?.priority || 'MEDIUM') as TaskCreateFormData['priority'],
      dueDate: initialData?.dueDate?.split('T')[0] || '',
    },
  });

  const currentPriority = watch('priority') as string || 'MEDIUM';

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description,
        priority: initialData.priority as TaskUpdateFormData['priority'],
        dueDate: initialData.dueDate?.split('T')[0] || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: TaskCreateFormData | TaskUpdateFormData) => {
    try {
      const payload: TaskCreateRequest | TaskUpdateRequest = {
        title: data.title?.trim() as string,
        description: data.description?.trim() || undefined,
        priority: data.priority || undefined,
        dueDate: (data.dueDate && data.dueDate.trim() !== '') ? data.dueDate.trim() : undefined,
      };

      await onSubmit(payload);
      if (mode === 'create') {
        reset({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
        });
      }
    } catch {
      // Error handled by parent
    }
  };

  const priorities = [
    { value: 'LOW', label: 'Low', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'MEDIUM', label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'HIGH', label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'CRITICAL', label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title *</Label>
        <Input
          id="task-title"
          type="text"
          {...register('title')}
          placeholder="Task title"
        />
        {errors.title && (
          <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-desc">Description</Label>
        <Textarea
          id="task-desc"
          {...register('description')}
          maxLength={5000}
          rows={3}
          placeholder="Detailed description (optional)"
          className="resize-none"
        />
        {errors.description && (
          <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <div className="flex gap-2 flex-wrap">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setValue('priority', p.value as TaskCreateFormData['priority'])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                currentPriority === p.value
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
        <Label htmlFor="task-date">Due date</Label>
        <Input
          id="task-date"
          type="date"
          {...register('dueDate')}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
          ) : mode === 'create' ? (
            'Create task'
          ) : (
            'Update'
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
