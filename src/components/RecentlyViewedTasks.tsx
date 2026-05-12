"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Circle, CheckCircle2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecentlyViewed, type RecentlyViewedTask } from "@/hooks/useRecentlyViewed";
import { formatDistanceToNow } from "date-fns";

// Status icon mapping — matches the pattern used across the app
const statusIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TODO: Circle,
  DOING: Clock,
  DONE: CheckCircle2,
};

const statusColorMap: Record<string, string> = {
  TODO: "text-muted-foreground",
  DOING: "text-amber-500",
  DONE: "text-emerald-500",
};

const priorityBadgeColor: Record<string, string> = {
  LOW: "bg-slate-500/15 text-slate-600 border-slate-500/20",
  MEDIUM: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  HIGH: "bg-orange-500/15 text-orange-600 border-orange-500/20",
  CRITICAL: "bg-red-500/15 text-red-600 border-red-500/20",
};

// Framer-motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function TaskItem({ task }: { task: RecentlyViewedTask }) {
  const StatusIcon = statusIconMap[task.status] || Circle;
  const iconColor = statusColorMap[task.status] || "text-muted-foreground";
  const badgeColor = priorityBadgeColor[task.priority] || priorityBadgeColor.MEDIUM;

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(task.viewedAt), { addSuffix: false });
    } catch {
      return "";
    }
  })();

  return (
    <motion.div variants={itemVariants}>
      <Link
        href={`/tasks/${task.id}`}
        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        {/* Status icon */}
        <StatusIcon className={`h-4 w-4 shrink-0 ${iconColor}`} />

        {/* Title + priority */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {task.title}
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0 rounded-full border shrink-0 ${badgeColor}`}
          >
            {task.priority}
          </span>
        </div>

        {/* Relative time */}
        {relativeTime && (
          <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
            {relativeTime}
          </span>
        )}
      </Link>
    </motion.div>
  );
}

export default function RecentlyViewedTasks() {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "350ms" }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Recently Viewed
          </CardTitle>
          {recentlyViewed.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentlyViewed}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <X className="h-3 w-3" />
              Clear history
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentlyViewed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 opacity-20 mb-2" strokeWidth={1.5} />
            <p className="text-sm font-medium">No recently viewed tasks</p>
            <p className="text-xs mt-0.5">Tasks you visit will appear here</p>
          </div>
        ) : (
          <motion.div
            className="max-h-64 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {recentlyViewed.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
