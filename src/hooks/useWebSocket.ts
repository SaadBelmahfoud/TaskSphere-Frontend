"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { NotificationResponse } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "./useNotifications";
import { toast } from "sonner";

const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

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
 * 1. Client connects to /ws (SockJS fallback)
 * 2. Client subscribes to /topic/notifications/{username}
 * 3. Server pushes notifications when events occur
 * 4. Client receives and processes notifications
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

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_WS_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
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
