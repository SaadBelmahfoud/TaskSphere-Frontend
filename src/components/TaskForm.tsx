"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, updateTaskSchema, type CreateTaskFormData, type UpdateTaskFormData } from "@/lib/schemas";
import type { TaskResponse, TaskPriority } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TaskFormProps {
  task?: TaskResponse;
  onSubmit: (data: CreateTaskFormData | UpdateTaskFormData) => void;
  loading?: boolean;
  mode: "create" | "edit";
}

export default function TaskForm({ task, onSubmit, loading, mode }: TaskFormProps) {
  const schema = mode === "create" ? createTaskSchema : updateTaskSchema;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(schema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          priority: task.priority as TaskPriority,
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          assigneeId: task.assigneeId || "",
        }
      : {
          title: "",
          description: "",
          priority: "MEDIUM" as TaskPriority,
        },
  });

  const [priority, setPriority] = useState<TaskPriority>(
    (task?.priority as TaskPriority) || "MEDIUM"
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Task title..."
          {...register("title")}
          disabled={loading}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the task..."
          rows={4}
          {...register("description")}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(val) => {
              setPriority(val as TaskPriority);
              setValue("priority", val as TaskPriority);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            {...register("dueDate")}
            disabled={loading}
          />
        </div>
      </div>

      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="assigneeId">Assignee ID (optional)</Label>
          <Input
            id="assigneeId"
            placeholder="Enter assignee user ID"
            {...register("assigneeId")}
            disabled={loading}
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create Task" : "Update Task"}
      </Button>
    </form>
  );
}
