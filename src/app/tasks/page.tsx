"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import TaskCard from "@/components/TaskCard";
import TaskForm from "@/components/TaskForm";
import { useTasks, useTaskSearch, useCreateTask } from "@/hooks/useTasks";
import type { TaskStatus, TaskPriority, CreateTaskFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, X } from "lucide-react";

export default function TasksPage() {
  const { auth } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasFilters = !!(keyword || statusFilter || priorityFilter);

  const { data: allTasks, isLoading: loadingAll } = useTasks(page, 20);
  const { data: searchResults, isLoading: loadingSearch } = useTaskSearch({
    keyword: keyword || undefined,
    status: (statusFilter || undefined) as TaskStatus | undefined,
    priority: (priorityFilter || undefined) as TaskPriority | undefined,
    page,
    size: 20,
  });

  const createTask = useCreateTask();

  const tasks = hasFilters ? searchResults : allTasks;
  const isLoading = hasFilters ? loadingSearch : loadingAll;

  useEffect(() => {
    if (!auth?.isAuthenticated) {
      router.replace("/");
    }
  }, [auth, router]);

  if (!auth?.isAuthenticated) return null;

  const handleCreate = (data: CreateTaskFormData) => {
    createTask.mutate(data, {
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  };

  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(0);
  };

  const isFirstPage = (tasks?.number ?? 0) === 0;
  const isLastPage = tasks ? tasks.number >= tasks.totalPages - 1 : true;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">Manage and track your tasks</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                mode="create"
                onSubmit={handleCreate}
                loading={createTask.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val === "ALL" ? "" : val);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="DOING">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(val) => {
              setPriorityFilter(val === "ALL" ? "" : val);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Task list */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        ) : tasks?.content && tasks.content.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.content.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={isFirstPage}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {(tasks.number ?? 0) + 1} of {tasks.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={isLastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No tasks found</p>
            <p className="text-sm mt-1">Create a new task to get started</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
