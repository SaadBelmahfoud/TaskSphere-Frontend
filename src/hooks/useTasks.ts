import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  TaskResponse,
  TaskPageResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskFilters,
  TaskStatusRequest,
  TaskAssignRequest,
} from "@/types";
import { toast } from "sonner";

export function useTasks(page: number = 0, size: number = 20) {
  return useQuery<TaskPageResponse>({
    queryKey: ["tasks", page, size],
    queryFn: async () => {
      const res = await api.get("/tasks", { params: { page, size } });
      return res.data;
    },
  });
}

export function useTaskSearch(params: TaskFilters) {
  return useQuery<TaskPageResponse>({
    queryKey: ["tasks", "search", params],
    queryFn: async () => {
      // CORRECTION : Le backend n'a PAS de /tasks/search !
      // GET /api/v1/tasks accepte déjà tous les filtres comme query params.
      // AVANT : api.get("/tasks/search", { params }) → 404
      // APRÈS : api.get("/tasks", { params }) → fonctionne
      const res = await api.get("/tasks", { params });
      return res.data;
    },
    // Toujours enabled — même sans filtres, /tasks retourne les tâches de l'utilisateur
    enabled: true,
  });
}

export function useTask(id: string) {
  return useQuery<TaskResponse>({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const res = await api.get(`/tasks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TaskCreateRequest) => {
      const res = await api.post("/tasks", data);
      return res.data as TaskResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task created successfully");
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskUpdateRequest }) => {
      const res = await api.put(`/tasks/${id}`, data);
      return res.data as TaskResponse;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", variables.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task updated successfully");
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}

export function useChangeTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/tasks/${id}/status`, { status } as TaskStatusRequest);
      return res.data as TaskResponse;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", variables.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task status updated");
    },
    onError: () => {
      toast.error("Failed to update task status");
    },
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskAssignRequest }) => {
      const res = await api.patch(`/tasks/${id}/assign`, data);
      return res.data as TaskResponse;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", variables.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      const isUnassign = variables.data.assigneeId === null || variables.data.assigneeId === "";
      toast.success(isUnassign ? "Task unassigned successfully" : "Task assigned successfully");
    },
    onError: () => {
      toast.error("Failed to update task assignment");
    },
  });
}
