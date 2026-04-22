import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { CommentResponse, CommentCreateRequest } from '@/types';

// ===== Query Keys Factory =====
export const commentKeys = {
  all: ['comments'] as const,
  byTask: () => [...commentKeys.all, 'byTask'] as const,
  taskComments: (taskId: string) => [...commentKeys.byTask(), taskId] as const,
};

// ===== Fonctions API =====

export async function getTaskComments(taskId: string): Promise<CommentResponse[]> {
  const response = await api.get<CommentResponse[]>(`/tasks/${taskId}/comments`);
  return response.data;
}

export async function createComment(
  taskId: string,
  data: CommentCreateRequest
): Promise<CommentResponse> {
  const response = await api.post<CommentResponse>(`/tasks/${taskId}/comments`, data);
  return response.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

// ===== Hooks TanStack Query =====

export function useTaskCommentsQuery(taskId: string) {
  return useQuery({
    queryKey: commentKeys.taskComments(taskId),
    queryFn: () => getTaskComments(taskId),
    enabled: !!taskId,
    staleTime: 0,
  });
}

export function useCreateCommentMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CommentCreateRequest) => createComment(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.taskComments(taskId) });
      toast.success('Commentaire ajouté');
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du commentaire", {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
}

export function useDeleteCommentMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.taskComments(taskId) });
      toast.success('Commentaire supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du commentaire', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
}
