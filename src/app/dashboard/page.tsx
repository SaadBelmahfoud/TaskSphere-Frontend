/**
 * ═══════════════════════════════════════════════════════════════════
 * DASHBOARD PAGE — Dynamic imports + Shared config
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 2 : Utilisation du module partagé task-config
 * PHASE 2 — TÂCHE 4 : Dynamic() imports pour recharts
 * ──────────────────────────────────────────────────────
 *
 * TÂCHE 2 :
 *   AVANT : statusChartConfig, priorityChartConfig, STATUS_COLORS,
 *           PRIORITY_COLORS, actionBadgeVariant, actionColors définis localement
 *   APRÈS : importés depuis @/lib/task-config
 *
 * TÂCHE 4 :
 *   AVANT : import statique de recharts (PieChart, BarChart, etc.)
 *           → ~200KB gzipped inclus dans le bundle initial
 *   APRÈS : dynamic() import → recharts n'est chargé QUE quand
 *           l'utilisateur visite /dashboard
 *
 *   PRINCIPE : Code Splitting avec next/dynamic
 *   recharts est la PLUS GROSSE dépendance du frontend.
 *   En le chargeant dynamiquement, on réduit significativement
 *   le bundle initial (First Load JS).
 *
 *   APPROCHE : On crée un composant wrapper ChartsSection qui
 *   importe recharts normalement, puis on utilise dynamic()
 *   pour charger ce wrapper de manière asynchrone.
 *   ssr: false car recharts utilise des APIs DOM pour les mesures SVG.
 */
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
import {
  statusChartConfig,
  priorityChartConfig,
  STATUS_COLORS,
  PRIORITY_COLORS,
  actionColors,
} from "@/lib/task-config";

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 2 — TÂCHE 4 : Dynamic import de la section Charts
 * ═══════════════════════════════════════════════════════════════════
 *
 * Le composant ChartsSection contient TOUS les imports recharts.
 * En le chargeant dynamiquement, on split le bundle :
 * - Le JS principal ne contient PAS recharts (~200KB économisés)
 * - Un chunk séparé "charts-section" est chargé en parallèle
 * - L'utilisateur voit les stat cards immédiatement, les charts
 *   apparaissent avec un léger délai (skeleton)
 */
const ChartsSection = dynamic(
  () => import("@/components/DashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
            <CardDescription>Loading chart...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
            <CardDescription>Loading chart...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    ),
  }
);

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
      color: "text-sky",
      bg: "bg-sky/10",
      border: "border-sky/20",
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
      color: "text-coral",
      bg: "bg-coral/10",
      border: "border-coral/20",
    },
  ];

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

        {/* Charts — loaded dynamically (Tâche 4) */}
        <ChartsSection
          stats={stats}
          statsLoading={statsLoading}
          statusChartConfig={statusChartConfig}
          priorityChartConfig={priorityChartConfig}
          STATUS_COLORS={STATUS_COLORS}
          PRIORITY_COLORS={PRIORITY_COLORS}
        />

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
                      activity.action === "CREATED" ? "bg-sky" :
                      activity.action === "DELETED" ? "bg-coral" :
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
