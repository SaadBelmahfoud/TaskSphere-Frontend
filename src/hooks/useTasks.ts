import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  TaskResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskStatusRequest,
  TaskPageResponse,
  TaskFilters,
} from '@/types';

// ===== Query Keys Factory =====
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...taskKeys.lists(), { page, size }] as const,
  filteredList: (filters: TaskFilters, page: number, size: number) =>
    [...taskKeys.all, 'filtered', filters, page, size] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// ================================================================
// DIRECT API FUNCTIONS (no cache)
// Used by: Ownership Test (needs fresh data)
// ================================================================

export async function createTask(data: TaskCreateRequest): Promise<TaskResponse> {
  const response = await api.post<TaskResponse>('/tasks', data);
  return response.data;
}

export async function getMyTasks(
  page: number = 0,
  size: number = 20,
  filters?: TaskFilters
): Promise<TaskPageResponse> {
  const params: Record<string, unknown> = { page, size };
  if (filters) {
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.dueDateFrom) params.dueDateFrom = filters.dueDateFrom;
    if (filters.dueDateTo) params.dueDateTo = filters.dueDateTo;
    if (filters.createdFrom) params.createdFrom = filters.createdFrom;
    if (filters.createdTo) params.createdTo = filters.createdTo;
    if (filters.assigneeId) params.assigneeId = filters.assigneeId;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortDir) params.sortDir = filters.sortDir;
  }
  const response = await api.get<TaskPageResponse>('/tasks', { params });
  return response.data;
}

export async function getTaskById(id: string): Promise<TaskResponse> {
  const response = await api.get<TaskResponse>(`/tasks/${id}`);
  return response.data;
}

export async function updateTask(id: string, data: TaskUpdateRequest): Promise<TaskResponse> {
  const response = await api.put<TaskResponse>(`/tasks/${id}`, data);
  return response.data;
}

export async function updateTaskStatus(id: string, status: string): Promise<TaskResponse> {
  const response = await api.patch<TaskResponse>(`/tasks/${id}/status`, {
    status,
  } satisfies TaskStatusRequest);
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function assignTask(id: string, assigneeId: string): Promise<TaskResponse> {
  const response = await api.patch<TaskResponse>(`/tasks/${id}/assign`, {
    assigneeId,
  });
  return response.data;
}

// ================================================================
// TANSTACK QUERY HOOKS (with cache + invalidation)
// Used by: tasks/page.tsx, tasks/[id]/page.tsx
// ================================================================

export function useMyTasksQuery(page: number = 0, size: number = 20) {
  return useQuery({
    queryKey: taskKeys.list(page, size),
    queryFn: () => getMyTasks(page, size),
    staleTime: 0,
  });
}

export function useFilteredTasksQuery(
  filters: TaskFilters,
  page: number = 0,
  size: number = 20
) {
  return useQuery({
    queryKey: taskKeys.filteredList(filters, page, size),
    queryFn: () => getMyTasks(page, size, filters),
    staleTime: 0,
  });
}

export function useTaskQuery(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => getTaskById(id),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error('Error creating task', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useUpdateTaskMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskUpdateRequest) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task updated');
    },
    onError: (error) => {
      toast.error('Error updating task', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useUpdateTaskStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success(`Status updated: ${variables.status}`);
    },
    onError: (error) => {
      toast.error('Error changing status', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error('Error deleting task', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

export function useAssignTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) => assignTask(id, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task assigned successfully');
    },
    onError: (error) => {
      toast.error('Error assigning task', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
