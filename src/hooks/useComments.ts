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

// ===== API functions =====

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

// ===== TanStack Query Hooks =====

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
      toast.success('Comment added');
    },
    onError: (error) => {
      toast.error('Error adding comment', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
      toast.success('Comment deleted');
    },
    onError: (error) => {
      toast.error('Error deleting comment', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
