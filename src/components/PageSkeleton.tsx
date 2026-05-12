"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function PageSkeleton() {
  return (
    <div className="space-y-6 page-skeleton">
      {/* Subtle shimmer animation */}
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            hsl(var(--accent)) 25%,
            hsl(var(--accent) / 0.6) 50%,
            hsl(var(--accent)) 75%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Skeleton header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Skeleton stats row (4 items) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 skeleton-shimmer" />
                <Skeleton className="h-8 w-8 rounded-full skeleton-shimmer" />
              </div>
              <Skeleton className="h-7 w-16 skeleton-shimmer" />
              <Skeleton className="h-3 w-24 skeleton-shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton content area (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 skeleton-shimmer" />
              <Skeleton className="h-8 w-8 rounded-md skeleton-shimmer" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full skeleton-shimmer" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4 skeleton-shimmer" />
                    <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full skeleton-shimmer" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <Card className="overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32 skeleton-shimmer" />
              <Skeleton className="h-8 w-8 rounded-md skeleton-shimmer" />
            </div>
            <Skeleton className="h-48 w-full rounded-lg skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 w-full rounded-lg skeleton-shimmer" />
              <Skeleton className="h-20 w-full rounded-lg skeleton-shimmer" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
