"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  MessageSquare,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

const actionIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATED: Plus,
  UPDATED: Edit3,
  STATUS_CHANGED: RefreshCw,
  DELETED: Trash2,
  COMMENTED: MessageSquare,
  ASSIGNED: UserPlus,
};

const actionBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "default",
  UPDATED: "secondary",
  STATUS_CHANGED: "outline",
  DELETED: "destructive",
  COMMENTED: "secondary",
  ASSIGNED: "outline",
};

const actionColor: Record<string, string> = {
  CREATED: "bg-emerald-500",
  UPDATED: "bg-amber-500",
  STATUS_CHANGED: "bg-blue-500",
  DELETED: "bg-red-500",
  COMMENTED: "bg-violet-500",
  ASSIGNED: "bg-cyan-500",
};

const PAGE_SIZE = 15;

export default function ActivitiesPage() {
  const { auth } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const { data: activities, isLoading } = useActivityLog(page, PAGE_SIZE);

  // Client-side filter by action type — must be before any early returns
  const filteredContent = useMemo(() => {
    if (!activities?.content) return [];
    if (actionFilter === "ALL") return activities.content;
    return activities.content.filter((a) => a.action === actionFilter);
  }, [activities, actionFilter]);

  const totalPages = activities?.totalPages ?? 1;
  const totalElements = activities?.totalElements ?? 0;

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, typeof filteredContent> = {};
    filteredContent.forEach((activity) => {
      const dateKey = format(new Date(activity.timestamp), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(activity);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        label: formatDateLabel(date),
        items,
      }));
  }, [filteredContent]);

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
              <p className="text-muted-foreground">
                Complete history of all workspace activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATED">Created</SelectItem>
                <SelectItem value="UPDATED">Updated</SelectItem>
                <SelectItem value="STATUS_CHANGED">Status Changed</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
                <SelectItem value="COMMENTED">Commented</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            {totalElements} total activities
          </span>
          {actionFilter !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              Filtered: {actionFilter}
            </Badge>
          )}
        </div>

        {/* Activity Timeline */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedActivities.length > 0 ? (
              <div className="space-y-8">
                {groupedActivities.map((group) => (
                  <div key={group.date}>
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-background px-3 py-1 rounded-full border">
                        {group.label}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Timeline items */}
                    <div className="relative ml-5 border-l-2 border-border space-y-4">
                      {group.items.map((activity) => {
                        const Icon = actionIcon[activity.action] || Activity;
                        const dotColor = actionColor[activity.action] || "bg-primary";

                        return (
                          <div
                            key={activity.id}
                            className="relative pl-6 pb-2 group"
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-background ${dotColor} flex items-center justify-center`}
                            >
                              <Icon className="h-2 w-2 text-white" />
                            </div>

                            {/* Content */}
                            <div className="rounded-lg p-3 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">
                                      {activity.username}
                                    </span>
                                    <Badge
                                      variant={
                                        actionBadgeVariant[activity.action] ||
                                        "secondary"
                                      }
                                      className="text-[10px]"
                                    >
                                      {activity.action.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {activity.description}
                                  </p>
                                  {activity.taskTitle && activity.taskId && (
                                    <Link
                                      href={`/tasks/${activity.taskId}`}
                                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
                                    >
                                      View task: {activity.taskTitle}
                                    </Link>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(
                                    new Date(activity.timestamp),
                                    { addSuffix: true }
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Activity className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm mt-1">
                  {actionFilter !== "ALL"
                    ? "Try changing the filter"
                    : "Activities will appear here as you use the platform"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {generatePageNumbers(page, totalPages).map((p, i) =>
                p === -1 ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(p)}
                  >
                    {p + 1}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return format(date, "EEEE, MMM d");
  return format(date, "MMMM d, yyyy");
}

function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages: number[] = [0];
  if (current > 2) pages.push(-1); // ellipsis
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 3) pages.push(-1); // ellipsis
  pages.push(total - 1);

  return pages;
}
