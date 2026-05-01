import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { UserAdminResponse } from "@/types";

/**
 * Fetch the list of users for assignee selection.
 *
 * Uses /iam/admin/users endpoint.
 *
 * IMPORTANT: The backend AdminController currently blocks MANAGER role
 * with a hard-coded check. The backend needs to be updated to allow
 * MANAGER read-only access to this endpoint. See the fix below:
 *
 * In AdminController.java, change:
 *   if (!"ADMIN".equals(role)) {
 * to:
 *   if (!"ADMIN".equals(role) && !"MANAGER".equals(role)) {
 *
 * This allows MANAGER to GET the user list (needed for task assignment)
 * while keeping role change and toggle endpoints ADMIN-only.
 */
export function useUsers() {
  return useQuery<UserAdminResponse[]>({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const res = await api.get("/iam/admin/users");

        // Handle different response formats:
        // - Plain array: res.data = [...]
        // - Paginated response: res.data = { content: [...], totalElements: N, ... }
        if (res.data) {
          if (Array.isArray(res.data)) {
            return res.data;
          }
          // Paginated Spring Boot Page response
          if (res.data.content && Array.isArray(res.data.content)) {
            return res.data.content;
          }
          // ResponseEntity body might be nested
          if (res.data.body && Array.isArray(res.data.body)) {
            return res.data.body;
          }
        }

        // If response format is unexpected, log and return empty
        console.warn("[useUsers] Unexpected response format:", res.data);
        return [];
      } catch (error: unknown) {
        // Log the actual error for debugging
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          console.warn(
            "[useUsers] 403 Forbidden — MANAGER role needs backend fix in AdminController.java"
          );
        } else {
          console.error("[useUsers] Failed to fetch users:", error);
        }
        return [];
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    refetchOnWindowFocus: true,
  });
}
