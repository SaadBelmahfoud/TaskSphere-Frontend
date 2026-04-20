'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  useFilteredTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} from '@/hooks/useTasks';
import { TaskCreateRequest, TaskUpdateRequest, TaskFilters } from '@/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ChevronLeft, ChevronRight, ClipboardList, Search, RotateCcw, SlidersHorizontal } from 'lucide-react';

const sortOptions = [
  { value: 'created_at', label: 'Date de création' },
  { value: 'priority', label: 'Priorité' },
  { value: 'due_date', label: 'Date d\'échéance' },
  { value: 'title', label: 'Titre' },
] as const;

export default function TasksPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<TaskFilters>({
    keyword: '',
    status: '',
    priority: '',
    dueDateFrom: '',
    dueDateTo: '',
    sortBy: 'created_at',
    sortDir: 'desc',
  });

  const { data: taskPage, isLoading } = useFilteredTasksQuery(filters, currentPage, 20);
  const createMutation = useCreateTaskMutation();
  const updateStatusMutation = useUpdateTaskStatusMutation();
  const deleteMutation = useDeleteTaskMutation();

  const tasks = taskPage?.content ?? [];
  const totalPages = taskPage?.totalPages ?? 0;
  const totalElements = taskPage?.totalElements ?? 0;

  const router = useRouter();

  // Compter les filtres actifs (non vides)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.keyword) count++;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.dueDateFrom) count++;
    if (filters.dueDateTo) count++;
    return count;
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      keyword: '',
      status: '',
      priority: '',
      dueDateFrom: '',
      dueDateTo: '',
      sortBy: 'created_at',
      sortDir: 'desc',
    });
    setCurrentPage(0);
  };

  const handleFilterChange = (key: keyof TaskFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handleCreate = async (data: TaskCreateRequest | TaskUpdateRequest) => {
    await createMutation.mutateAsync(data as TaskCreateRequest);
    setShowCreateForm(false);
    setCurrentPage(0);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Mes Tâches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalElements} tâche{totalElements !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filtres
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant={showCreateForm ? 'outline' : 'default'}
            size="sm"
          >
            {showCreateForm ? <><X className="h-4 w-4 mr-1" /> Annuler</> : <><Plus className="h-4 w-4 mr-1" /> Nouvelle tâche</>}
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par titre..."
            value={filters.keyword || ''}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="bg-card rounded-xl border shadow-sm p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Filtres et tri</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Statut */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Tous les statuts</option>
                <option value="TODO">À faire</option>
                <option value="DOING">En cours</option>
                <option value="DONE">Terminé</option>
              </select>
            </div>

            {/* Priorité */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priorité</Label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Toutes les priorités</option>
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>

            {/* Date d'échéance début */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Échéance à partir de</Label>
              <Input
                type="date"
                value={filters.dueDateFrom || ''}
                onChange={(e) => handleFilterChange('dueDateFrom', e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Date d'échéance fin */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Échéance jusqu&apos;au</Label>
              <Input
                type="date"
                value={filters.dueDateTo || ''}
                onChange={(e) => handleFilterChange('dueDateTo', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-xs text-muted-foreground">Trier par</Label>
            <div className="flex gap-2 flex-wrap">
              {sortOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={filters.sortBy === opt.value ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sortBy: opt.value,
                      sortDir:
                        prev.sortBy === opt.value && prev.sortDir === 'desc' ? 'asc' : 'desc',
                    }))
                  }
                  className="text-xs"
                >
                  {opt.label}
                  {filters.sortBy === opt.value && (
                    <span className="ml-1">
                      {filters.sortDir === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-card rounded-xl border shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Nouvelle tâche</h2>
          <TaskForm mode="create" onSubmit={handleCreate} isLoading={createMutation.isPending} />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex items-center justify-between pt-3 border-t">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {activeFilterCount > 0 ? 'Aucun résultat' : 'Aucune tâche'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeFilterCount > 0
              ? 'Aucune tâche ne correspond à vos filtres.'
              : 'Créez votre première tâche pour commencer !'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser les filtres
            </Button>
          )}
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

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage + 1} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Supprimer la tâche"
        message="Cette action est irréversible. La tâche sera archivée (soft delete)."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
}
