"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "tasksphere_recently_viewed";
const MAX_ITEMS = 8;

export interface RecentlyViewedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  viewedAt: string;
}

function readFromStorage(): RecentlyViewedTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentlyViewedTask[];
  } catch {
    return [];
  }
}

function writeToStorage(items: RecentlyViewedTask[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTask[]>(() => readFromStorage());

  const addViewedTask = useCallback(
    (task: RecentlyViewedTask) => {
      setRecentlyViewed((prev) => {
        // Remove any existing entry with the same id (duplicate)
        const filtered = prev.filter((item) => item.id !== task.id);
        // Add the new task to the front
        const updated = [task, ...filtered].slice(0, MAX_ITEMS);
        writeToStorage(updated);
        return updated;
      });
    },
    []
  );

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    writeToStorage([]);
  }, []);

  return { recentlyViewed, addViewedTask, clearRecentlyViewed };
}
