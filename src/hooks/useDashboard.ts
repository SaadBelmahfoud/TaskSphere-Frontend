import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStatsResponse } from '@/types';

// ===== Query Keys Factory =====
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStatsResponse> => {
      const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}
