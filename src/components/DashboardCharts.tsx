/**
 * ═══════════════════════════════════════════════════════════════════
 * DASHBOARD CHARTS — Composant extrait pour dynamic() import
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 4 : Ce composant est chargé dynamiquement
 * via next/dynamic dans dashboard/page.tsx.
 *
 * PRINCIPE : Code Splitting
 *   TOUTE la librairie recharts (~200KB gzipped) est importée
 *   uniquement dans ce fichier. Quand dashboard/page.tsx utilise
 *   dynamic(() => import("./DashboardCharts")), Next.js crée
 *   un chunk séparé pour ce composant.
 *
 *   L'utilisateur voit les stat cards immédiatement (pas de recharts),
 *   puis les charts apparaissent après le chargement du chunk.
 *
 * PROPRIÉTÉS :
 *   Ce composant reçoit les données via props (pas de hooks API)
 *   car le parent (dashboard/page.tsx) gère déjà le fetch.
 */
"use client";

import type { DashboardStatsResponse } from "@/types";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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

interface ChartsSectionProps {
  stats: DashboardStatsResponse | undefined;
  statsLoading: boolean;
  statusChartConfig: ChartConfig;
  priorityChartConfig: ChartConfig;
  STATUS_COLORS: Record<string, string>;
  PRIORITY_COLORS: Record<string, string>;
}

export default function DashboardCharts({
  stats,
  statsLoading,
  statusChartConfig,
  priorityChartConfig,
  STATUS_COLORS,
  PRIORITY_COLORS,
}: ChartsSectionProps) {
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
  );
}
