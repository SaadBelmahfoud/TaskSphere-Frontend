import type { TaskResponse } from "@/types";

/**
 * Escape a CSV field value: wrap in quotes if it contains commas, quotes, or newlines.
 * Double any existing quotes per CSV spec (RFC 4180).
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a date string for display in export.
 * Returns empty string for null/undefined values.
 */
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date in YYYY-MM-DD format for filenames.
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Trigger a file download in the browser.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tasks to CSV format and trigger download.
 * Columns: Title, Description, Status, Priority, Due Date, Assignee, Created At
 */
export function exportToCSV(tasks: TaskResponse[]): void {
  const headers = ["Title", "Description", "Status", "Priority", "Due Date", "Assignee", "Created At"];

  const rows = tasks.map((task) => [
    escapeCSV(task.title || ""),
    escapeCSV(task.description || ""),
    escapeCSV(task.status || ""),
    escapeCSV(task.priority || ""),
    escapeCSV(formatDate(task.dueDate)),
    escapeCSV(task.assigneeId || "Unassigned"),
    escapeCSV(formatDate(task.createdAt)),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `tasksphere-tasks-${getTodayDateString()}.csv`;

  downloadBlob(blob, filename);
}

/**
 * Export tasks to JSON format and trigger download.
 * Includes metadata about the export (count, date, source).
 */
export function exportToJSON(tasks: TaskResponse[]): void {
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    source: "TaskSphere",
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || null,
      completedAt: task.completedAt || null,
      createdAt: task.createdAt || null,
      userId: task.userId,
      assigneeId: task.assigneeId || null,
    })),
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const filename = `tasksphere-tasks-${getTodayDateString()}.json`;

  downloadBlob(blob, filename);
}
