'use client';

import { memo } from 'react';
import { TaskResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, ArrowRight, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: TaskResponse;
  onView: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

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

function TaskCardInner({ task, onView, onStatusChange, onDelete }: TaskCardProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <button onClick={() => onView(task.id)} className="text-left flex-1 min-w-0 group">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {task.title}
            </h3>
          </button>
          <Badge variant={priority.variant} className={priority.className}>
            {priority.label}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </CardContent>

      <div className="border-t px-5 py-3 flex items-center justify-between bg-muted/30 rounded-b-lg">
        <Button variant="ghost" size="sm" onClick={() => onView(task.id)} className="text-primary hover:text-primary/80">
          <Eye className="h-3.5 w-3.5 mr-1" />
          Voir détails
        </Button>
        <div className="flex items-center gap-1">
          {nextStatus && (
            <Button variant="outline" size="sm" onClick={() => onStatusChange(task.id, nextStatus)} className="text-xs">
              <ArrowRight className="h-3 w-3 mr-1" />
              {statusConfig[nextStatus].label}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onDelete(task.id)} className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Supprimer
          </Button>
        </div>
      </div>
    </Card>
  );
}

const TaskCard = memo(TaskCardInner);
TaskCard.displayName = 'TaskCard';
export default TaskCard;
