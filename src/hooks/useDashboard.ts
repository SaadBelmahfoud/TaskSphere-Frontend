import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStatsResponse } from "@/types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

export function useDashboardStats() {
  return useQuery<DashboardStatsResponse>({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data;
    },
  });
}
