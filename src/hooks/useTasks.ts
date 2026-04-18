import api from '@/lib/api';
import {
  TaskResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskStatusRequest,
  TaskPageResponse,
} from '@/types';

// ===== CRUD Tâches =====

export async function createTask(data: TaskCreateRequest): Promise<TaskResponse> {
  const response = await api.post<TaskResponse>('/tasks', data);
  return response.data;
}

export async function getMyTasks(page: number = 0, size: number = 20): Promise<TaskPageResponse> {
  const response = await api.get<TaskPageResponse>('/tasks', {
    params: { page, size },
  });
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
