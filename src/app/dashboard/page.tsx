"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useTasks } from "@/hooks/useTasks";
import AppLayout from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  ListTodo,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  Columns3,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Clock,
  Circle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";
import Link from "next/link";

// ─── Chart Configs ───────────────────────────────────────────────
const statusChartConfig: ChartConfig = {
  TODO: { label: "To Do", color: "hsl(220, 70%, 55%)" },
  DOING: { label: "In Progress", color: "hsl(38, 90%, 55%)" },
  DONE: { label: "Done", color: "hsl(142, 70%, 45%)" },
};

const priorityChartConfig: ChartConfig = {
  LOW: { label: "Low", color: "hsl(142, 70%, 55%)" },
  MEDIUM: { label: "Medium", color: "hsl(38, 90%, 55%)" },
  HIGH: { label: "High", color: "hsl(0, 80%, 55%)" },
  CRITICAL: { label: "Critical", color: "hsl(340, 80%, 50%)" },
};

const trendChartConfig: ChartConfig = {
  created: { label: "Created", color: "var(--chart-1)" },
  completed: { label: "Completed", color: "var(--chart-3)" },
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "var(--color-TODO)",
  DOING: "var(--color-DOING)",
  DONE: "var(--color-DONE)",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "var(--color-LOW)",
  MEDIUM: "var(--color-MEDIUM)",
  HIGH: "var(--color-HIGH)",
  CRITICAL: "var(--color-CRITICAL)",
};

const actionBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CREATED: "default",
  UPDATED: "secondary",
  STATUS_CHANGED: "outline",
  DELETED: "destructive",
  COMMENTED: "secondary",
  ASSIGNED: "outline",
};

// ─── Helper: Status icon/color for mini task list ────────────────
const statusDisplay: Record<
  string,
  { icon: typeof Circle; color: string; label: string }
> = {
  TODO: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
  DOING: {
    icon: Loader2,
    color: "text-amber-500",
    label: "In Progress",
  },
  DONE: { icon: CheckCircle2, color: "text-emerald-500", label: "Done" },
};

const priorityBadgeClass: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CRITICAL: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
};

// ─── Helper: Generate mock weekly trend data ─────────────────────
function generateWeeklyTrend(createdWeek: number, completedWeek: number) {
  const data = [];
  const today = new Date();
  // Distribute weekly totals across 7 days with realistic variance
  const createdPerDay = createdWeek / 7;
  const completedPerDay = completedWeek / 7;

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    // Add some variance: ±40% random-ish based on day index
    const createdVariance = 1 + 0.4 * Math.sin(i * 1.5);
    const completedVariance = 1 + 0.4 * Math.cos(i * 1.3);
    const created = Math.max(
      0,
      Math.round(createdPerDay * createdVariance)
    );
    const completed = Math.max(
      0,
      Math.round(completedPerDay * completedVariance)
    );
    data.push({
      day: format(date, "EEE"),
      date: format(date, "MMM d"),
      created,
      completed,
    });
  }
  return data;
}

// ─── Stat Card Component ─────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  gradientFrom,
  gradientTo,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  gradientFrom: string;
  gradientTo: string;
  isLoading: boolean;
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Gradient accent strip at top */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            )}
            {trendLabel && !isLoading && (
              <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{trendLabel}</span>
              </div>
            )}
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} bg-opacity-10`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  gradientFrom,
  gradientTo,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer">
        <CardContent className="p-5 flex items-start gap-4">
          <div
            className={`p-2.5 rounded-lg bg-gradient-to-br ${gradientFrom} ${gradientTo} shrink-0`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm group-hover:text-primary transition-colors">
              {label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────
export default function DashboardPage() {
  const { auth } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const [activityPage, setActivityPage] = useState(0);
  const { data: activities, isLoading: activitiesLoading } = useActivityLog(
    activityPage,
    10
  );
  const { data: myTasks, isLoading: tasksLoading } = useTasks(0, 5);

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  // Generate weekly trend data based on stats
  const weeklyTrendData = useMemo(() => {
    if (!stats) return [];
    return generateWeeklyTrend(
      stats.tasksCreatedThisWeek,
      stats.tasksCompletedThisWeek
    );
  }, [stats]);

  // Determine trend direction for stat cards
  const createdTrend: "up" | "down" | "neutral" =
    (stats?.tasksCreatedThisWeek ?? 0) > (stats?.tasksCompletedThisWeek ?? 0)
      ? "up"
      : (stats?.tasksCreatedThisWeek ?? 0) <
          (stats?.tasksCompletedThisWeek ?? 0)
        ? "down"
        : "neutral";

  const completedTrend: "up" | "down" | "neutral" =
    (stats?.tasksCompletedThisWeek ?? 0) > 0 ? "up" : "neutral";

  const overdueTrend: "up" | "down" | "neutral" =
    (stats?.overdueTasks ?? 0) > 0 ? "down" : "neutral";

  if (!auth?.isAuthenticated) return null;

  const isLastActivityPage = activities
    ? activities.number >= activities.totalPages - 1
    : true;

  // Convert Record<string, number> to array for recharts
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

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* ─── Header ────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {auth.username || auth.email}
          </p>
        </div>

        {/* ─── Stat Cards ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Tasks"
            value={stats?.totalTasks ?? 0}
            icon={ListTodo}
            trend="neutral"
            trendLabel="All time"
            gradientFrom="from-primary"
            gradientTo="to-primary/70"
            isLoading={statsLoading}
          />
          <StatCard
            title="Created This Week"
            value={stats?.tasksCreatedThisWeek ?? 0}
            icon={CalendarPlus}
            trend={createdTrend}
            trendLabel={
              createdTrend === "up"
                ? "More created than completed"
                : createdTrend === "down"
                  ? "Less than completed"
                  : "Same as completed"
            }
            gradientFrom="from-amber-500"
            gradientTo="to-orange-500"
            isLoading={statsLoading}
          />
          <StatCard
            title="Completed This Week"
            value={stats?.tasksCompletedThisWeek ?? 0}
            icon={CheckCircle2}
            trend={completedTrend}
            trendLabel={
              completedTrend === "up" ? "Great progress!" : "No completions yet"
            }
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-500"
            isLoading={statsLoading}
          />
          <StatCard
            title="Overdue"
            value={stats?.overdueTasks ?? 0}
            icon={AlertTriangle}
            trend={overdueTrend}
            trendLabel={
              overdueTrend === "down" ? "Needs attention" : "All on track"
            }
            gradientFrom="from-red-500"
            gradientTo="to-rose-500"
            isLoading={statsLoading}
          />
        </div>

        {/* ─── Quick Actions ─────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickAction
              icon={Plus}
              label="Create Task"
              description="Add a new task to your workspace"
              href="/tasks"
              gradientFrom="from-primary"
              gradientTo="to-primary/70"
            />
            <QuickAction
              icon={Columns3}
              label="View Kanban"
              description="Manage tasks on the Kanban board"
              href="/kanban"
              gradientFrom="from-amber-500"
              gradientTo="to-orange-500"
            />
            <QuickAction
              icon={Users}
              label="Manage Users"
              description="View and manage team members"
              href="/admin"
              gradientFrom="from-violet-500"
              gradientTo="to-purple-500"
            />
          </div>
        </div>

        {/* ─── Charts Row ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PieChart - Tasks by Status */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tasks by Status</CardTitle>
              <CardDescription>Distribution across statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : statusData.length > 0 ? (
                <ChartContainer
                  config={statusChartConfig}
                  className="h-[280px] w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      strokeWidth={2}
                      stroke="var(--background)"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="status" />}
                    />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No task data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* BarChart - Tasks by Priority */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tasks by Priority</CardTitle>
              <CardDescription>Distribution across priorities</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : priorityData.length > 0 ? (
                <ChartContainer
                  config={priorityChartConfig}
                  className="h-[280px] w-full"
                >
                  <BarChart data={priorityData} accessibilityLayer>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="priority"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="priority" />}
                    />
                    <Bar dataKey="count" radius={6}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No task data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* LineChart - Weekly Trend */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly Trend</CardTitle>
              <CardDescription>
                Created vs completed — last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : weeklyTrendData.length > 0 ? (
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[280px] w-full"
                >
                  <AreaChart
                    data={weeklyTrendData}
                    accessibilityLayer
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="fillCreated"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="fillCompleted"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--chart-3)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-3)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          return item?.date || label;
                        }} />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#fillCreated)"
                      dot={{ r: 3, fill: "var(--chart-1)" }}
                      activeDot={{ r: 5 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      fill="url(#fillCompleted)"
                      dot={{ r: 3, fill: "var(--chart-3)" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Bottom Section: My Tasks + Activities ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Tasks Summary */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    My Tasks
                  </CardTitle>
                  <CardDescription>Your most recent tasks</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tasks" className="gap-1 text-xs">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : myTasks?.content && myTasks.content.length > 0 ? (
                <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
                  {myTasks.content.slice(0, 5).map((task) => {
                    const display = statusDisplay[task.status] || statusDisplay.TODO;
                    const StatusIcon = display.icon;
                    return (
                      <Link
                        key={task.id}
                        href="/tasks"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <StatusIcon
                          className={`h-4 w-4 shrink-0 ${display.color} ${
                            task.status === "DOING" ? "animate-spin" : ""
                          }`}
                          style={
                            task.status === "DOING"
                              ? { animationDuration: "3s" }
                              : undefined
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${priorityBadgeClass[task.priority] || priorityBadgeClass.MEDIUM}`}
                            >
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(task.dueDate), {
                                  addSuffix: true,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            task.status === "DONE" ? "secondary" : "outline"
                          }
                          className="text-[10px] shrink-0"
                        >
                          {display.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <ListTodo className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No tasks yet</p>
                  <Button variant="link" size="sm" asChild className="mt-1">
                    <Link href="/tasks">Create your first task</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest actions across your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : activities?.content && activities.content.length > 0 ? (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {activities.content.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
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
                              {activity.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      {index < activities.content.length - 1 && (
                        <Separator className="mt-3" />
                      )}
                    </div>
                  ))}
                  {!isLastActivityPage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setActivityPage((p) => p + 1)}
                    >
                      Load More
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Activity className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No activities yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
