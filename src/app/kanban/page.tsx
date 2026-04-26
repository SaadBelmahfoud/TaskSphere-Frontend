'use client';

import { useMemo, useState } from 'react';
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
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ColumnStatus = 'TODO' | 'DOING' | 'DONE';

const columnConfig: Record<ColumnStatus, { label: string; color: string; bgColor: string }> = {
  TODO: {
    label: 'To Do',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  },
  DOING: {
    label: 'In Progress',
    color: 'text-sky-700 dark:text-sky-300',
    bgColor: 'bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800',
  },
  DONE: {
    label: 'Done',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  MEDIUM: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-800' },
  HIGH: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800' },
};

// ===== Draggable task card =====
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

// ===== Drag overlay card =====
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

// ===== Droppable column =====
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

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 lg:w-96">
      <div
        ref={setNodeRef}
        className={`rounded-xl border ${config.bgColor} p-3 min-h-[200px] transition-colors ${
          isOver ? 'ring-2 ring-primary/50 ring-offset-1' : ''
        }`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
              {tasks.length}
            </Badge>
          </div>
        </div>

        {/* Sortable task list */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 italic">
                {isOver ? 'Drop here' : 'No tasks'}
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

// ===== Main Kanban Page =====
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

  // Group tasks by status
  const columns: Record<ColumnStatus, typeof allTasks> = useMemo(
    () => ({
      TODO: allTasks.filter((t) => t.status === 'TODO'),
      DOING: allTasks.filter((t) => t.status === 'DOING'),
      DONE: allTasks.filter((t) => t.status === 'DONE'),
    }),
    [allTasks]
  );

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
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Don't do anything if dropped on the same card
    if (activeId === overId) return;

    // Find the dragged task
    const draggedTask = allTasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Determine target column
    let targetColumn: ColumnStatus | null = null;

    // Case 1: dropped on a column (drop zone)
    if (overId.startsWith('column-')) {
      targetColumn = overId.replace('column-', '') as ColumnStatus;
    } else {
      // Case 2: dropped on another task → find its column
      const overTask = allTasks.find((t) => t.id === overId);
      if (overTask) {
        targetColumn = overTask.status as ColumnStatus;
      }
    }

    // Update status if column changed
    if (targetColumn && targetColumn !== draggedTask.status) {
      updateStatusMutation.mutate({
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
          Kanban Board
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drag and drop tasks to change their status
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
          <h3 className="text-lg font-medium text-foreground mb-2">No tasks</h3>
          <p className="text-sm text-muted-foreground">
            Create tasks to see them appear in the Kanban board.
          </p>
        </div>
      )}
    </AppLayout>
  );
}
