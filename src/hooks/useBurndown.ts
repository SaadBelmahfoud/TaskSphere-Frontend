import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { BurndownDataResponse } from "@/types";

/**
 * Fetches burndown chart data for the dashboard.
 *
 * The burndown chart shows the number of remaining tasks over time
 * compared to an ideal linear trajectory, helping teams visualise
 * whether they are on track to complete their workload.
 *
 * @param {number} [days=14] — The number of days to look back for the burndown chart.
 * @returns {UseQueryResult<BurndownDataResponse>} Query result containing burndown points.
 *
 * @example
 * ```tsx
 * const { data: burndown, isLoading } = useBurndownData(14);
 * ```
 */
export function useBurndownData(days: number = 14) {
  return useQuery<BurndownDataResponse>({
    queryKey: ["dashboard", "burndown", days],
    queryFn: async () => {
      const res = await api.get("/dashboard/burndown", { params: { days } });
      return res.data;
    },
  });
}
