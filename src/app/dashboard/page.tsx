'use client';

import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
} from 'lucide-react';
import { useDashboardStatsQuery } from '@/hooks/useDashboard';

const statusLabels: Record<string, string> = {
  TODO: 'To Do',
  DOING: 'In Progress',
  DONE: 'Done',
};

const statusColors: Record<string, string> = {
  TODO: 'bg-slate-400',
  DOING: 'bg-amber-400',
  DONE: 'bg-emerald-400',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-yellow-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-500',
};

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStatsQuery();

  const statCards = stats
    ? [
        {
          label: 'Total Tasks',
          value: stats.totalTasks,
          icon: ClipboardList,
          color: 'text-primary',
        },
        {
          label: 'Created This Week',
          value: stats.tasksCreatedThisWeek,
          icon: CalendarPlus,
          color: 'text-emerald-600',
        },
        {
          label: 'Completed This Week',
          value: stats.tasksCompletedThisWeek,
          icon: CheckCircle2,
          color: 'text-emerald-500',
        },
        {
          label: 'Overdue',
          value: stats.overdueTasks,
          icon: AlertTriangle,
          color: 'text-red-500',
        },
      ]
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your tasks and recent activities
          </p>
        </div>

        {/* Stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-8 w-10" />
                  </div>
                  <Skeleton className="h-4 w-28 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">
                Error loading statistics
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                      <span className="text-2xl font-bold text-foreground">
                        {card.value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{card.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tasks by status and priority */}
        {!isLoading && !isError && stats && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* By status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(statusLabels).map(([key, label]) => {
                  const count = stats.tasksByStatus[key] || 0;
                  const total = stats.totalTasks || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground">{label}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${statusColors[key] || 'bg-slate-400'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* By priority */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(priorityLabels).map(([key, label]) => {
                  const count = stats.tasksByPriority[key] || 0;
                  const total = stats.totalTasks || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground">{label}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${priorityColors[key] || 'bg-slate-400'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent activities */}
        {!isLoading && !isError && stats && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <Badge
                        variant="outline"
                        className="shrink-0 mt-0.5 text-xs font-normal"
                      >
                        {activity.action}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground break-words">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {activity.username}
                          </span>
                          <span className="text-xs text-muted-foreground">&bull;</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No recent activities
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
