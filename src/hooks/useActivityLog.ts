import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ActivityLogPageResponse } from "@/types";

export function useActivityLog(page: number = 0, size: number = 20, taskId?: string) {
  return useQuery<ActivityLogPageResponse>({
    queryKey: ["activities", page, size, taskId],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, size };
      if (taskId) params.taskId = taskId;
      const res = await api.get("/activities", { params });
      return res.data;
    },
  });
}
