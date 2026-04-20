'use client';

import { useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useFilteredTasksQuery, useUpdateTaskStatusMutation } from '@/hooks/useTasks';
import { TaskFilters } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Columns3 } from 'lucide-react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

type ColumnStatus = 'TODO' | 'DOING' | 'DONE';

const columnConfig: Record<ColumnStatus, { label: string; color: string; bgColor: string }> = {
  TODO: {
    label: 'À faire',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  },
  DOING: {
    label: 'En cours',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  },
  DONE: {
    label: 'Terminé',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Basse', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  MEDIUM: { label: 'Moyenne', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800' },
  HIGH: { label: 'Haute', className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800' },
  CRITICAL: { label: 'Critique', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800' },
};

// ===== Composant carte draggable =====
interface SortableTaskCardProps {
  task: {
    id: string;
    title: string;
    priority: string;
    status: string;
  };
}

function SortableTaskCard({ task }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
    >
      <p className="text-sm font-medium text-foreground truncate mb-1.5">{task.title}</p>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priority.className}`}>
          {priority.label}
        </span>
      </div>
    </div>
  );
}

// ===== Composant overlay pendant le drag =====
function DragOverlayCard({ task }: { task: { id: string; title: string; priority: string; status: string } | null }) {
  if (!task) return null;

  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  return (
    <div className="bg-card rounded-lg border shadow-lg p-3 w-64 opacity-90">
      <p className="text-sm font-medium text-foreground truncate mb-1.5">{task.title}</p>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priority.className}`}>
        {priority.label}
      </span>
    </div>
  );
}

// ===== Composant colonne =====
interface ColumnProps {
  status: ColumnStatus;
  tasks: {
    id: string;
    title: string;
    priority: string;
    status: string;
  }[];
}

function Column({ status, tasks }: ColumnProps) {
  const config = columnConfig[status];
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 lg:w-96">
      <div className={`rounded-xl border ${config.bgColor} p-3 min-h-[200px]`}>
        {/* En-tête de colonne */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
              {tasks.length}
            </Badge>
          </div>
        </div>

        {/* Liste de tâches triables */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 italic">
                Aucune tâche
              </p>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ===== Page principale Kanban =====
export default function KanbanPage() {
  const [activeTask, setActiveTask] = useState<{
    id: string;
    title: string;
    priority: string;
    status: string;
  } | null>(null);

  const updateStatusMutation = useUpdateTaskStatusMutation();

  const filters: TaskFilters = {};

  const { data: taskPage, isLoading } = useFilteredTasksQuery(filters, 0, 200);
  const allTasks = useMemo(() => taskPage?.content ?? [], [taskPage]);

  // Grouper les tâches par statut
  const columns: Record<ColumnStatus, typeof allTasks> = useMemo(
    () => ({
      TODO: allTasks.filter((t) => t.status === 'TODO'),
      DOING: allTasks.filter((t) => t.status === 'DOING'),
      DONE: allTasks.filter((t) => t.status === 'DONE'),
    }),
    [allTasks]
  );

  // Tous les IDs pour le DndContext
  const allTaskIds = useMemo(() => allTasks.map((t) => t.id), [allTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = allTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Déterminer la colonne de destination
    const draggedTask = allTasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // Trouver dans quelle colonne la tâche a été déposée
    let targetColumn: ColumnStatus | null = null;
    for (const [status, colTasks] of Object.entries(columns)) {
      if (colTasks.some((t) => t.id === over.id)) {
        targetColumn = status as ColumnStatus;
        break;
      }
    }

    if (targetColumn && targetColumn !== draggedTask.status) {
      updateStatusMutation.mutateAsync({
        id: draggedTask.id,
        status: targetColumn,
      });
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Columns3 className="h-6 w-6 text-primary" />
          Tableau Kanban
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Glissez-déposez les tâches pour changer leur statut
        </p>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.values(columnConfig).map((config, i) => (
            <div key={i} className="flex-shrink-0 w-72 sm:w-80 lg:w-96">
              <div className={`rounded-xl border ${config.bgColor} p-3`}>
                <Skeleton className="h-5 w-20 mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="bg-card rounded-lg border shadow-sm p-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {(Object.keys(columnConfig) as ColumnStatus[]).map((status) => (
              <Column key={status} status={status} tasks={columns[status]} />
            ))}
          </div>
          <DragOverlay>
            <DragOverlayCard task={activeTask} />
          </DragOverlay>
        </DndContext>
      )}

      {allTasks.length === 0 && !isLoading && (
        <div className="text-center py-16 mt-4">
          <Columns3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune tâche</h3>
          <p className="text-sm text-muted-foreground">
            Créez des tâches pour les voir apparaître dans le tableau Kanban.
          </p>
        </div>
      )}
    </AppLayout>
  );
}
