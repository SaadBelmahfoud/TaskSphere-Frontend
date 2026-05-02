"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, updateTaskSchema, type CreateTaskFormData } from "@/lib/schemas";
import type { TaskResponse, TaskPriority } from "@/types";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, ChevronsUpDown, Check, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityConfig } from "@/lib/task-config";

/**
 * ═══════════════════════════════════════════════════════════════════
 * PHASE 2 — TÂCHE 2 : Utilisation du module partagé task-config
 * ═══════════════════════════════════════════════════════════════════
 *
 * AVANT : priorityConfig défini localement (6 lignes)
 * APRÈS : importé depuis @/lib/task-config (1 ligne)
 * ═══════════════════════════════════════════════════════════════════
 */

interface TaskFormProps {
  task?: TaskResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  loading?: boolean;
  mode: "create" | "edit";
}

export default function TaskForm({ task, onSubmit, loading, mode }: TaskFormProps) {
  const schema = mode === "create" ? createTaskSchema : updateTaskSchema;
  const { data: users } = useUsers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
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

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const selectedAssigneeId = watch("assigneeId");

  const selectedUser = users?.find((u) => u.email === selectedAssigneeId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          {...register("title")}
          disabled={loading}
          className="transition-colors"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the task in detail..."
          rows={4}
          {...register("description")}
          disabled={loading}
          className="resize-none transition-colors"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Priority + Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <Select
            value={priority}
            onValueChange={(val) => {
              setPriority(val as TaskPriority);
              setValue("priority", val as TaskPriority);
            }}
          >
            <SelectTrigger className="transition-colors">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(priorityConfig) as [string, typeof priorityConfig[string]][]).map(
                ([value, config]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block w-2 h-2 rounded-full", config.color.split(" ")[0])} />
                      {config.label}
                    </div>
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            {...register("dueDate")}
            disabled={loading}
            className="transition-colors"
          />
        </div>
      </div>

      {/* Assignee dropdown — only in create mode */}
      {mode === "create" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Assignee</Label>
          <div className="flex items-center gap-2">
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assigneeOpen}
                  className="flex-1 justify-between font-normal"
                  disabled={loading}
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {selectedUser.firstName?.[0]?.toUpperCase() || selectedUser.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        ({selectedUser.email})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Select assignee...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search users by name or email..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {users
                        ?.filter((u) => u.enabled)
                        .map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.firstName} ${user.lastName} ${user.email} ${user.username}`}
                            onSelect={() => {
                              // CORRECTION : Envoyer user.email (pas user.id)
                              // Le backend TaskEntity.assigneeId stocke un EMAIL
                              setValue("assigneeId", user.email);
                              setAssigneeOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 ml-1">
                              {user.role}
                            </Badge>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedAssigneeId === user.email ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedAssigneeId && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => setValue("assigneeId", "")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "create" ? "Create Task" : "Update Task"}
      </Button>
    </form>
  );
}
