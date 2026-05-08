import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { NotificationResponse } from "@/types";
import { toast } from "sonner";

/**
 * Query key factory for notification-related queries.
 * Provides a consistent and type-safe way to generate query keys
 * for cache invalidation and query identification.
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

/**
 * Fetches the current user's notification list.
 *
 * @returns {UseQueryResult<NotificationResponse[]>} Query result containing an array of notifications.
 *
 * @example
 * ```tsx
 * const { data: notifications, isLoading } = useNotifications();
 * ```
 */
export function useNotifications() {
  return useQuery<NotificationResponse[]>({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
  });
}

/**
 * Fetches the count of unread notifications for the current user.
 * Automatically refetches every 30 seconds to keep the badge count fresh.
 *
 * @returns {UseQueryResult<{ unreadCount: number }>} Query result containing the unread count.
 *
 * @example
 * ```tsx
 * const { data } = useUnreadNotificationCount();
 * const unreadBadge = data?.unreadCount ?? 0;
 * ```
 */
export function useUnreadNotificationCount() {
  return useQuery<{ unreadCount: number }>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const res = await api.get("/notifications/unread-count");
      return res.data;
    },
    refetchInterval: 30000,
  });
}

/**
 * Marks a single notification as read.
 * Automatically invalidates all notification queries on success
 * so the list and unread count refresh.
 *
 * @returns {UseMutationResult<void, Error, string>} Mutation result — pass the notification `id` to `mutate`.
 *
 * @example
 * ```tsx
 * const markRead = useMarkNotificationRead();
 * markRead.mutate(notificationId);
 * ```
 */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Marks all notifications as read for the current user.
 * Invalidates all notification queries and shows a success toast on completion.
 *
 * @returns {UseMutationResult<void, Error, void>} Mutation result — call `mutate()` with no arguments.
 *
 * @example
 * ```tsx
 * const markAllRead = useMarkAllNotificationsRead();
 * markAllRead.mutate();
 * ```
 */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/notifications/read-all");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success("All notifications marked as read");
    },
  });
}
