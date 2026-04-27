import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CommentResponse, CommentCreateRequest, CommentUpdateRequest } from "@/types";
import { toast } from "sonner";

export function useComments(taskId: string) {
  return useQuery<CommentResponse[]>({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}/comments`);
      return res.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommentCreateRequest) => {
      const res = await api.post(`/tasks/${taskId}/comments`, data);
      return res.data as CommentResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment added");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });
}

export function useUpdateComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, data }: { commentId: string; data: CommentUpdateRequest }) => {
      const res = await api.put(`/comments/${commentId}`, data);
      return res.data as CommentResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment updated");
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      toast.success("Comment deleted");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });
}
