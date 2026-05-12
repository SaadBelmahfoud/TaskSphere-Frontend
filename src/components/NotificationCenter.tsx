"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellOff,
  CheckCheck,
  UserPlus,
  ArrowRightLeft,
  MessageSquare,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type NotificationType =
  | "task_assigned"
  | "task_status_changed"
  | "comment_added"
  | "task_overdue"
  | "task_due_soon";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  taskLink?: string;
}

// --- Mock Data ---
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "task_assigned",
    title: "Nouvelle tâche assignée",
    description:
      "Pierre Dupont vous a assigné la tâche « Refonte de l'interface utilisateur »",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    read: false,
    taskLink: "/tasks",
  },
  {
    id: "n2",
    type: "comment_added",
    title: "Commentaire ajouté",
    description:
      "Marie Laurent a commenté sur « Intégration API de paiement » : « Il faut vérifier les cas limites »",
    timestamp: new Date(Date.now() - 22 * 60 * 1000), // 22 min ago
    read: false,
    taskLink: "/tasks",
  },
  {
    id: "n3",
    type: "task_due_soon",
    title: "Échéance approche",
    description:
      "La tâche « Rapport trimestriel Q4 » est due dans 2 heures",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    read: false,
    taskLink: "/tasks",
  },
  {
    id: "n4",
    type: "task_status_changed",
    title: "Statut modifié",
    description:
      "Jean Martin a déplacé « Correction bug #2847 » de En cours à Terminé",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    taskLink: "/tasks",
  },
  {
    id: "n5",
    type: "task_overdue",
    title: "Tâche en retard",
    description:
      "« Mise à jour documentation technique » était due hier et n'est pas terminée",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    taskLink: "/tasks",
  },
  {
    id: "n6",
    type: "task_assigned",
    title: "Nouvelle tâche assignée",
    description:
      "Sophie Bernard vous a assigné « Tests unitaires module Auth »",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: true,
    taskLink: "/tasks",
  },
  {
    id: "n7",
    type: "comment_added",
    title: "Commentaire ajouté",
    description:
      "Lucas Petit a commenté sur « Optimisation des performances » : « Les résultats sont excellents ! »",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    taskLink: "/tasks",
  },
  {
    id: "n8",
    type: "task_status_changed",
    title: "Statut modifié",
    description:
      "Claire Moreau a déplacé « Design system v2 » de À faire à En cours",
    timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
    read: true,
    taskLink: "/tasks",
  },
  {
    id: "n9",
    type: "task_due_soon",
    title: "Échéance approche",
    description:
      "« Revue de code sprint 12 » est due demain à 17h00",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    read: true,
    taskLink: "/tasks",
  },
  {
    id: "n10",
    type: "task_overdue",
    title: "Tâche en retard",
    description:
      "« Configuration CI/CD pipeline » était due il y a 3 jours",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    read: true,
    taskLink: "/tasks",
  },
];

// --- Icon & Color Mapping ---
const typeConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  task_assigned: {
    icon: UserPlus,
    bgColor: "bg-blue-100 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
  },
  task_status_changed: {
    icon: ArrowRightLeft,
    bgColor: "bg-emerald-100 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-l-emerald-500",
  },
  comment_added: {
    icon: MessageSquare,
    bgColor: "bg-purple-100 dark:bg-purple-950/40",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-l-purple-500",
  },
  task_overdue: {
    icon: AlertTriangle,
    bgColor: "bg-red-100 dark:bg-red-950/40",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-l-red-500",
  },
  task_due_soon: {
    icon: Clock,
    bgColor: "bg-amber-100 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-l-amber-500",
  },
};

// --- Animation Variants ---
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
    },
  },
};

// --- Component Props ---
interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
}

// --- Component ---
export default function NotificationCenter({
  open,
  onOpenChange,
  onUnreadCountChange,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    MOCK_NOTIFICATIONS
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Sync unread count to parent on every change
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[400px] p-0 flex flex-col gap-0"
      >
        {/* Glass-morphism Header */}
        <SheetHeader className="p-0 space-y-0">
          <div className="relative px-5 py-4 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold leading-none">
                    Notifications
                  </SheetTitle>
                  {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tout marquer lu
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>
        <SheetDescription className="sr-only">
          Panneau de notifications — tâches assignées, commentaires et rappels
        </SheetDescription>

        {/* Notification List */}
        {notifications.length > 0 ? (
          <ScrollArea className="flex-1 max-h-[calc(100vh-140px)]">
            <AnimatePresence mode="wait">
              {open && (
                <motion.div
                  key="notification-list"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col"
                >
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type];
                    const Icon = config.icon;
                    const isUnread = !notification.read;

                    return (
                      <motion.div
                        key={notification.id}
                        variants={itemVariants}
                        className={cn(
                          "relative flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-150 border-l-[3px] hover:bg-muted/40",
                          isUnread
                            ? cn("bg-primary/[0.03]", config.borderColor)
                            : "border-l-transparent"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        {/* Unread dot indicator */}
                        {isUnread && (
                          <div className="absolute top-4 right-3 h-2 w-2 rounded-full bg-primary" />
                        )}

                        {/* Icon */}
                        <div
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-full shrink-0 mt-0.5",
                            config.bgColor
                          )}
                        >
                          <Icon className={cn("h-4 w-4", config.iconColor)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-sm leading-tight",
                                isUnread
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground/80"
                              )}
                            >
                              {notification.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {notification.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60">
                            {formatDistanceToNow(notification.timestamp, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/50">
                <BellOff className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex items-center justify-center h-6 w-6 rounded-full bg-background border border-border shadow-sm">
                <CheckCheck className="h-3 w-3 text-emerald-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground/70">
              Vous êtes à jour !
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Aucune notification pour le moment. Nous vous préviendrons quand
              quelque chose se produit.
            </p>
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2.5 bg-muted/20">
              <Link
                href="/dashboard"
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary py-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                Voir toutes les notifications
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
