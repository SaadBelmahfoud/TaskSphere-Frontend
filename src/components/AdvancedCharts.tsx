"use client";

import { useBurndownData } from "@/hooks/useBurndown";
import { useVelocityData } from "@/hooks/useVelocity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

const burndownChartConfig = {
  remaining: { label: "Remaining", color: "var(--primary)" },
  idealRemaining: { label: "Ideal", color: "var(--muted-foreground)" },
};

const velocityChartConfig = {
  completed: { label: "Completed", color: "var(--sky)" },
};

export default function AdvancedCharts() {
  const [burndownDays, setBurndownDays] = useState("14");
  const [velocityWeeks, setVelocityWeeks] = useState("8");

  const { data: burndown, isLoading: burndownLoading } = useBurndownData(parseInt(burndownDays));
  const { data: velocity, isLoading: velocityLoading } = useVelocityData(parseInt(velocityWeeks));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Burndown Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              Burndown Chart
            </CardTitle>
            <CardDescription>Work remaining over time</CardDescription>
          </div>
          <Select value={burndownDays} onValueChange={setBurndownDays}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {burndownLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : burndown && burndown.points.length > 0 ? (
            <ChartContainer config={burndownChartConfig} className="h-[280px] w-full">
              <LineChart data={burndown.points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="idealRemaining"
                  stroke="var(--color-muted-foreground)"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  dot={false}
                  name="Ideal"
                />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Actual"
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              No burndown data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Velocity Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky" />
              Velocity Chart
            </CardTitle>
            <CardDescription>
              Tasks completed per week
              {velocity && ` · Avg: ${velocity.averageVelocity.toFixed(1)}/week`}
            </CardDescription>
          </div>
          <Select value={velocityWeeks} onValueChange={setVelocityWeeks}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 weeks</SelectItem>
              <SelectItem value="8">8 weeks</SelectItem>
              <SelectItem value="12">12 weeks</SelectItem>
              <SelectItem value="26">26 weeks</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {velocityLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : velocity && velocity.points.length > 0 ? (
            <ChartContainer config={velocityChartConfig} className="h-[280px] w-full">
              <BarChart data={velocity.points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="weekStart"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
                />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                {velocity.averageVelocity > 0 && (
                  <ReferenceLine
                    y={velocity.averageVelocity}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="5 5"
                    label={{ value: "Avg", position: "right", fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                )}
                <Bar dataKey="completed" fill="var(--color-sky)" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
              No velocity data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
