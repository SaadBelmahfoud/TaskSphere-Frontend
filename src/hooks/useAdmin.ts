import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { UserAdminResponse } from '@/types';

// ===== Query Keys Factory =====
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
};

// ===== API functions =====

export async function getAllUsers(): Promise<UserAdminResponse[]> {
  const response = await api.get<UserAdminResponse[]>('/iam/admin/users');
  return response.data;
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await api.patch(`/iam/admin/users/${userId}/role`, { role });
}

export async function toggleUserStatus(userId: string): Promise<void> {
  await api.patch(`/iam/admin/users/${userId}/toggle`);
}

// ===== TanStack Query Hooks =====

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
      toast.success('Role updated');
    },
    onError: (error) => {
      toast.error('Error updating role', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
      toast.success('User status updated');
    },
    onError: (error) => {
      toast.error('Error changing user status', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
