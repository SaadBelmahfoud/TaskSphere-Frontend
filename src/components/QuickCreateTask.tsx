"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TaskForm from "@/components/TaskForm";
import { useCreateTask } from "@/hooks/useTasks";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { CreateTaskFormData } from "@/lib/schemas";

// Custom event name for opening the quick create task dialog from other components
export const OPEN_QUICK_CREATE_TASK_EVENT = "open-quick-create-task";

export default function QuickCreateTask() {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();

  // Listen for Cmd+N / Ctrl+N keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for custom event from CommandPalette and other components
  useEffect(() => {
    const handleCustomOpen = () => setOpen(true);
    window.addEventListener(OPEN_QUICK_CREATE_TASK_EVENT, handleCustomOpen);
    return () =>
      window.removeEventListener(OPEN_QUICK_CREATE_TASK_EVENT, handleCustomOpen);
  }, []);

  const handleSubmit = useCallback(
    (data: CreateTaskFormData) => {
      // Filter out empty dueDate to avoid Jackson parse error on backend
      const payload = {
        ...data,
        dueDate: data.dueDate || undefined,
        assigneeId: data.assigneeId || undefined,
      };

      createTask.mutate(payload, {
        onSuccess: () => {
          setOpen(false);
          toast.success("Task created successfully!");
        },
        onError: () => {
          toast.error("Failed to create task. Please try again.");
        },
      });
    },
    [createTask]
  );

  // Detect platform for shortcut display
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle className="text-lg">Quick Create Task</DialogTitle>
            </div>
            <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
              {isMac ? "⌘N" : "Ctrl+N"}
            </Badge>
          </div>
          <DialogDescription>
            Create a new task quickly. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          mode="create"
          onSubmit={handleSubmit}
          loading={createTask.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
