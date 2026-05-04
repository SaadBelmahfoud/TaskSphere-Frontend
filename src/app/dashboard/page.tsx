"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useActivityLog } from "@/hooks/useActivityLog";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ListTodo,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  Activity,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Phase 3: Dynamic import for AdvancedCharts (code splitting)
const AdvancedCharts = dynamic(() => import("@/components/AdvancedCharts"), {
  ssr: false,
  loading: () => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="h-[350px] bg-muted/20 rounded-lg animate-pulse" /><div className="h-[350px] bg-muted/20 rounded-lg animate-pulse" /></div>,
});

// Chart configs — using semantic color tokens
const statusChartConfig: ChartConfig = {
  TODO: { label: "To Do", color: "var(--muted-foreground)" },
  DOING: { label: "In Progress", color: "var(--sky)" },
  DONE: { label: "Done", color: "var(--emerald)" },
};

const priorityChartConfig: ChartConfig = {
  LOW: { label: "Low", color: "var(--sky)" },
  MEDIUM: { label: "Medium", color: "var(--amber)" },
  HIGH: { label: "High", color: "var(--orange)" },
  CRITICAL: { label: "Critical", color: "var(--coral)" },
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "var(--color-muted-foreground)",
  DOING: "var(--color-sky)",
  DONE: "var(--color-emerald)",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "var(--color-sky)",
  MEDIUM: "var(--color-amber)",
  HIGH: "var(--color-orange)",
  CRITICAL: "var(--color-coral)",
};

const actionBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATED: "default",
  UPDATED: "secondary",
  STATUS_CHANGED: "outline",
  DELETED: "destructive",
  COMMENTED: "secondary",
  ASSIGNED: "outline",
  UNASSIGNED: "outline",
};

const actionColors: Record<string, string> = {
  CREATED: "bg-sky/10 text-sky",
  UPDATED: "bg-amber/10 text-amber",
  STATUS_CHANGED: "bg-emerald/10 text-emerald",
  DELETED: "bg-coral/10 text-coral",
  COMMENTED: "bg-muted text-muted-foreground",
  ASSIGNED: "bg-orange/10 text-orange",
  UNASSIGNED: "bg-orange/10 text-orange",
};

export default function DashboardPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const [activityPage, setActivityPage] = useState(0);
  const { data: activities, isLoading: activitiesLoading } = useActivityLog(activityPage, 10);

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated) return null;

  const completionRate = stats?.totalTasks
    ? Math.round(((stats.tasksByStatus?.DONE || 0) / stats.totalTasks) * 100)
    : 0;

  const statCards = [
    {
      title: "Total Tasks",
      value: stats?.totalTasks ?? 0,
      icon: ListTodo,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      title: "Created This Week",
      value: stats?.tasksCreatedThisWeek ?? 0,
      icon: CalendarPlus,
      color: "text-teal",
      bg: "bg-teal/10",
      border: "border-teal/20",
    },
    {
      title: "Completed This Week",
      value: stats?.tasksCompletedThisWeek ?? 0,
      icon: CheckCircle2,
      color: "text-emerald",
      bg: "bg-emerald/10",
      border: "border-emerald/20",
    },
    {
      title: "Overdue",
      value: stats?.overdueTasks ?? 0,
      icon: AlertTriangle,
      color: "text-rose",
      bg: "bg-rose/10",
      border: "border-rose/20",
    },
  ];

  const statusData = stats?.tasksByStatus
    ? Object.entries(stats.tasksByStatus).map(([status, count]) => ({
        status,
        count,
        fill: STATUS_COLORS[status] || "var(--chart-1)",
      }))
    : [];

  const priorityData = stats?.tasksByPriority
    ? Object.entries(stats.tasksByPriority).map(([priority, count]) => ({
        priority,
        count,
        fill: PRIORITY_COLORS[priority] || "var(--chart-1)",
      }))
    : [];

  const isLastActivityPage = activities
    ? activities.number >= activities.totalPages - 1
    : true;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting()}, {auth.username || auth.email?.split("@")[0]} 👋
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your tasks today
            </p>
          </div>
          <Link href="/tasks">
            <Button variant="outline" size="sm" className="gap-2">
              View All Tasks
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className={cn("border", card.border)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-3xl font-bold mt-1 tabular-nums">{card.value}</p>
                      )}
                    </div>
                    <div className={cn("p-3 rounded-xl", card.bg)}>
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completion rate */}
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Completion Rate</span>
              </div>
              <span className="text-2xl font-bold tabular-nums">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.tasksByStatus?.DONE || 0} of {stats?.totalTasks || 0} tasks completed
            </p>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PieChart - Tasks by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tasks by Status</CardTitle>
              <CardDescription>Distribution across statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : statusData.length > 0 ? (
                <ChartContainer config={statusChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No task data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* BarChart - Tasks by Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tasks by Priority</CardTitle>
              <CardDescription>Distribution across priorities</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : priorityData.length > 0 ? (
                <ChartContainer config={priorityChartConfig} className="h-[300px] w-full">
                  <BarChart data={priorityData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="priority" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent nameKey="priority" />} />
                    <Bar dataKey="count" radius={4}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No task data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Phase 3: Advanced Charts — Burndown & Velocity */}
        <AdvancedCharts />

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest actions across your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activities?.content && activities.content.length > 0 ? (
              <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin pr-2">
                {activities.content.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      "mt-0.5 w-2 h-2 rounded-full shrink-0",
                      activity.action === "CREATED" ? "bg-teal" :
                      activity.action === "DELETED" ? "bg-rose" :
                      activity.action === "STATUS_CHANGED" ? "bg-emerald" :
                      "bg-muted-foreground"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{activity.username}</span>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", actionColors[activity.action] || "bg-muted text-muted-foreground")}>
                          {activity.action}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {!isLastActivityPage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setActivityPage((p) => p + 1)}
                  >
                    Load More
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No activities yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
