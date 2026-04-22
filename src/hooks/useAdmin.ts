import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { UserAdminResponse } from '@/types';

// ===== Query Keys Factory =====
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
};

// ===== Fonctions API =====

export async function getAllUsers(): Promise<UserAdminResponse[]> {
  const response = await api.get<UserAdminResponse[]>('/iam/admin/users');
  return response.data;
}

export async function updateUserRole(userId: string, role: string): Promise<UserAdminResponse> {
  const response = await api.patch<UserAdminResponse>(`/iam/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function toggleUserStatus(userId: string): Promise<UserAdminResponse> {
  const response = await api.patch<UserAdminResponse>(`/iam/admin/users/${userId}/toggle`);
  return response.data;
}

// ===== Hooks TanStack Query =====

export function useAllUsersQuery() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: getAllUsers,
    staleTime: 0,
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('Rôle mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour du rôle', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success('Statut utilisateur mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors du changement de statut', {
        description: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    },
  });
}
