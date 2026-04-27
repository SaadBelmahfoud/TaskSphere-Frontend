import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UserAdminResponse, UserRole } from "@/types";
import { toast } from "sonner";

export function useAdminUsers() {
  return useQuery<UserAdminResponse[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.get("/iam/admin/users");
      return res.data;
    },
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const res = await api.patch(`/iam/admin/users/${userId}/role`, { role });
      return res.data as UserAdminResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Role updated successfully");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/iam/admin/users/${userId}/toggle`);
      return res.data as UserAdminResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User status updated");
    },
    onError: () => {
      toast.error("Failed to update user status");
    },
  });
}
