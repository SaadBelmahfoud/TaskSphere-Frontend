"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { NotificationResponse } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "./useNotifications";
import { toast } from "sonner";

/**
 * WebSocket hook for real-time notifications via STOMP over SockJS.
 *
 * PRINCIPLE : STOMP (Simple Text Oriented Messaging Protocol)
 * STOMP provides pub/sub messaging over WebSocket with:
 * - Destinations (topics) for routing
 * - Standard message format (headers + body)
 * - Subscription management
 *
 * FLOW :
 * 1. Client connects to /ws (SockJS fallback) with JWT in STOMP headers
 * 2. Server authenticates via StompAuthChannelInterceptor
 * 3. Client subscribes to /user/queue/notifications (user-specific)
 * 4. Server pushes notifications when events occur
 * 5. Client receives and processes notifications
 *
 * FIX : Added connectHeaders with JWT for STOMP authentication.
 * Without this, the backend cannot identify the user and cannot
 * route user-specific notifications via convertAndSendToUser().
 *
 * @param {string | null} username — The current user's username. When `null`,
 *   the hook will not attempt a connection.
 * @returns {{ connected: boolean; lastNotification: NotificationResponse | null }}
 *   An object containing:
 *   - `connected` — `true` when the STOMP client is actively connected.
 *   - `lastNotification` — The most recently received notification, or `null`.
 *
 * @example
 * ```tsx
 * const { connected, lastNotification } = useWebSocket(currentUser?.username ?? null);
 * ```
 */
export function useWebSocket(username: string | null) {
  const stompClient = useRef<Client | null>(null);
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationResponse | null>(null);

  const connect = useCallback(() => {
    if (!username || stompClient.current?.active) return;

    // FIX : Extract JWT token from localStorage for STOMP authentication.
    // The backend StompAuthChannelInterceptor reads the Authorization header
    // from the STOMP CONNECT frame to set the Principal.
    const stored = localStorage.getItem("tasksphere_auth");
    const authData = stored ? JSON.parse(stored) : null;
    const token = authData?.state?.accessToken || authData?.accessToken;

    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // FIX : Pass JWT token in STOMP connectHeaders.
      // This is sent in the CONNECT frame and read by the backend
      // StompAuthChannelInterceptor to authenticate the user.
      connectHeaders: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
      onConnect: () => {
        setConnected(true);
        // Subscribe to user-specific notification queue.
        // Spring's user destination routing requires an authenticated Principal.
        client.subscribe(`/user/queue/notifications`, (message: IMessage) => {
          try {
            const notification: NotificationResponse = JSON.parse(message.body);
            setLastNotification(notification);
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
            });
          } catch {
            // ignore parse errors
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
      },
    });

    stompClient.current = client;
    client.activate();
  }, [username, queryClient]);

  const disconnect = useCallback(() => {
    if (stompClient.current?.active) {
      stompClient.current.deactivate();
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { connected, lastNotification };
}
