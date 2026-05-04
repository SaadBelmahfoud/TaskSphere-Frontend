"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { useWebSocket } from "@/hooks/useWebSocket";
import { notificationTypeConfig } from "@/lib/task-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  CheckCheck,
  UserPlus,
  Pencil,
  ArrowRightLeft,
  Trash2,
  MessageSquare,
  Shield,
  UserMinus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  UserMinus,
  Pencil,
  ArrowRightLeft,
  Trash2,
  MessageSquare,
  Shield,
};

export default function NotificationBell() {
  const { auth } = useAuth();
  const [open, setOpen] = useState(false);
  
  // WebSocket connection for real-time notifications
  useWebSocket(auth?.email || null);
  
  const { data: notifications = [] } = useNotifications();
  const { data: unreadData } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  
  const unreadCount = unreadData?.count || 0;

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(id);
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const getIcon = (type: string) => {
    const config = notificationTypeConfig[type];
    if (!config) return Bell;
    const IconComponent = iconMap[config.icon];
    return IconComponent || Bell;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification, index) => {
              const Icon = getIcon(notification.type);
              const typeConfig = notificationTypeConfig[notification.type];
              return (
                <div key={notification.id}>
                  {index > 0 && <Separator />}
                  <div
                    className={cn(
                      "flex gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleMarkRead(notification.id, notification.read)}
                  >
                    <div className={cn("mt-0.5 shrink-0", typeConfig?.color || "text-muted-foreground")}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm leading-tight",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{notification.actorUsername}</span>
                        <span>·</span>
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {notification.taskId && (
                        <Link
                          href={`/tasks/${notification.taskId}`}
                          onClick={() => setOpen(false)}
                          className="text-xs text-primary hover:underline"
                        >
                          View task →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
