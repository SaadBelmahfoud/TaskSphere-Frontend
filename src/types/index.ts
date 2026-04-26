// ===== Types based on the actual backend code =====

export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string | null;
  userId: string;
  assigneeId?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
}

export interface TaskStatusRequest {
  status: string;
}

export interface TaskPageResponse {
  content: TaskResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ===== Advanced task filters =====
export interface TaskFilters {
  keyword?: string;
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  assigneeId?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  role: string | null;
  isAuthenticated: boolean;
  tokenExpiry: number | null;
}

// ===== Standardized API error interface =====
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  status: number;
  details?: string;
  path?: string;
}

// ===== Type Guard isApiError =====
export function isApiError(error: unknown): error is { response: { data: ApiErrorResponse; status: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object' &&
    (error as Record<string, unknown>).response !== null &&
    'data' in (error as Record<string, unknown>).response &&
    typeof ((error as Record<string, unknown>).response as Record<string, unknown>).data === 'object'
  );
}

// ===== Sprint 3 — Collaboration Types =====

export interface CommentResponse {
  id: string;
  content: string;
  username: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentCreateRequest {
  content: string;
}

export interface ActivityLogResponse {
  id: string;
  action: string;
  description: string;
  username: string;
  taskId: string | null;
  taskTitle: string | null;
  timestamp: string;
}

export interface ActivityLogPageResponse {
  content: ActivityLogResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DashboardStatsResponse {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  recentActivities: ActivityLogResponse[];
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  overdueTasks: number;
}

export interface UserAdminResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
}
