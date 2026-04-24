import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safe local date parsing — avoids timezone shift bugs.
 *
 * Problem: `new Date("2025-01-15")` is parsed as UTC midnight.
 * In timezones behind UTC (e.g. UTC-5), this becomes Jan 14 at 19:00 local time.
 * toLocaleDateString() then shows the wrong day.
 *
 * Solution: split the ISO date string and construct the Date using local-year/month/day
 * so it is always interpreted in the user's local timezone.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}
