"use client";

import { useActivityLog } from "@/hooks/useActivityLog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { actionColors } from "@/lib/task-config";
import { Clock, ArrowRight, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ChangeDetail } from "@/types";

interface AuditTrailViewProps {
  taskId: string;
}

export default function AuditTrailView({ taskId }: AuditTrailViewProps) {
  const { data, isLoading } = useActivityLog(0, 50, taskId);

  const activities = data?.content || [];

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No activity recorded yet. Actions like status changes, assignments, and comments will appear here.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-0">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative">
            {/* Timeline line */}
            {index < activities.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}

            <div className="flex gap-3 p-3 hover:bg-muted/30 transition-colors">
              {/* Timeline dot */}
              <div className={cn(
                "mt-1 h-[30px] w-[30px] rounded-full flex items-center justify-center shrink-0",
                actionColors[activity.action] || "bg-muted text-muted-foreground"
              )}>
                <Clock className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {activity.action.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {activity.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">{activity.description}</p>

                {/* Field-level changes */}
                {Array.isArray(activity.changeDetails) && activity.changeDetails.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {activity.changeDetails.map((change: ChangeDetail, ci: number) => (
                      <div key={ci} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                        <span className="font-medium text-foreground">{change.field}</span>
                        <span className="text-muted-foreground line-through">{change.oldValue || "—"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-primary font-medium">{change.newValue || "—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
