"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useMounted } from "@/hooks/useMounted";
import AppLayout from "@/components/AppLayout";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Edit3,
  ArrowRightLeft,
  Trash2,
  MessageSquare,
  UserPlus,
  Filter,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from "date-fns";
import Link from "next/link";

const actionConfig: Record<string, {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: typeof Plus;
  color: string;
}> = {
  CREATED: { variant: "default", icon: Plus, color: "text-emerald-500" },
  UPDATED: { variant: "secondary", icon: Edit3, color: "text-amber-500" },
  STATUS_CHANGED: { variant: "outline", icon: ArrowRightLeft, color: "text-sky-500" },
  DELETED: { variant: "destructive", icon: Trash2, color: "text-destructive" },
  COMMENTED: { variant: "secondary", icon: MessageSquare, color: "text-violet-500" },
  ASSIGNED: { variant: "outline", icon: UserPlus, color: "text-pink-500" },
};

function groupByDate(activities: { id: string; timestamp: string }[]): Map<string, { id: string; timestamp: string }[]> {
  const groups = new Map<string, { id: string; timestamp: string }[]>();
  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    let label: string;
    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else if (isThisWeek(date)) {
      label = format(date, "EEEE");
    } else {
      label = format(date, "MMMM d, yyyy");
    }
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(activity);
  });
  return groups;
}

function ActivitiesContent() {
  const { auth } = useAuth();
  const router = useRouter();
  const mounted = useMounted();

  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("");
  const { data: activities, isLoading } = useActivityLog(page, 20);
  const [localFilter, setLocalFilter] = useState<string>("");

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated || !mounted) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  const allActivities = activities?.content ?? [];

  // Apply client-side action filter
  const filteredActivities = localFilter
    ? allActivities.filter((a) => a.action === localFilter)
    : allActivities;

  const grouped = groupByDate(filteredActivities as { id: string; timestamp: string }[]);
  const isLastPage = activities ? activities.number >= activities.totalPages - 1 : true;

  // Stats
  const actionCounts: Record<string, number> = {};
  allActivities.forEach((a) => {
    actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Activity Log
            </h1>
            <p className="text-muted-foreground">
              Track all actions across your workspace
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(actionConfig).map(([action, config]) => {
            const Icon = config.icon;
            const count = actionCounts[action] || 0;
            return (
              <Card
                key={action}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  localFilter === action ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setLocalFilter(localFilter === action ? "" : action)}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <div>
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{action.replace("_", " ")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        {localFilter && (
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span>Filtered by: <Badge variant="secondary">{localFilter.replace("_", " ")}</Badge></span>
            <Button variant="ghost" size="sm" onClick={() => setLocalFilter("")}>
              Clear
            </Button>
          </div>
        )}

        {/* Activity timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>{activities?.totalElements ?? 0} total activities</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {Array.from(grouped.entries()).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-1">
                      {dateLabel}
                    </h3>
                    <div className="space-y-3 relative ml-3 border-l-2 border-muted pl-6">
                      {items.map((item) => {
                        const activity = item as typeof allActivities[0];
                        const config = actionConfig[activity.action] || actionConfig.UPDATED;
                        const Icon = config.icon;
                        return (
                          <div
                            key={activity.id}
                            className="relative -left-[1.85rem] flex items-start gap-3 pb-4"
                          >
                            <div className={`w-6 h-6 rounded-full bg-background border-2 border-muted flex items-center justify-center shrink-0 ${config.color}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <div className="flex-1 min-w-0 -mt-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{activity.username}</span>
                                <Badge variant={config.variant} className="text-xs">
                                  {activity.action.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                </span>
                                {activity.taskId && (
                                  <Link href={`/tasks/${activity.taskId}`} className="text-xs text-primary hover:underline">
                                    View task →
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {(activities?.number ?? 0) + 1} of {activities?.totalPages ?? 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLastPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activities found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    }>
      <ActivitiesContent />
    </Suspense>
  );
}
