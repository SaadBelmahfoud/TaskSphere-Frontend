import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { VelocityDataResponse } from "@/types";

/**
 * Fetches velocity chart data for the dashboard.
 *
 * The velocity chart shows the number of tasks completed per week
 * over a configurable time window, along with the average velocity.
 * This helps teams estimate how much work they can complete in
 * upcoming sprints.
 *
 * @param {number} [weeks=8] — The number of weeks to look back for the velocity chart.
 * @returns {UseQueryResult<VelocityDataResponse>} Query result containing velocity points and average.
 *
 * @example
 * ```tsx
 * const { data: velocity, isLoading } = useVelocityData(8);
 * ```
 */
export function useVelocityData(weeks: number = 8) {
  return useQuery<VelocityDataResponse>({
    queryKey: ["dashboard", "velocity", weeks],
    queryFn: async () => {
      const res = await api.get("/dashboard/velocity", { params: { weeks } });
      return res.data;
    },
  });
}
