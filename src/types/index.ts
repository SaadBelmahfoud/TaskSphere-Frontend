// ===== Types based on the actual TaskSphere Spring Boot backend =====
// These types MUST match the backend DTOs exactly.

// ===== Auth Types =====
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
  expiresIn: number;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  tokenExpiry: number | null;
}

// ===== Task Types =====
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TagResponse {
  id: string;
  name: string;
  color: string;
}

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
  assigneeId?: string | null;
  tags?: TagResponse[];
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  tagIds?: string[];
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  tagIds?: string[];
}

export interface TaskStatusRequest {
  status: string;
}

export interface TaskAssignRequest {
  assigneeId: string | null;
}

export interface TaskPageResponse {
  content: TaskResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ===== Advanced Task Filters =====
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
  page?: number;
  size?: number;
}

// ===== Dashboard =====
export interface DashboardStatsResponse {
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  recentActivities: ActivityLogResponse[];
  tasksCreatedThisWeek: number;
  tasksCompletedThisWeek: number;
  overdueTasks: number;
}

// ===== Burndown / Velocity (Phase 3) =====
export interface BurndownPoint {
  date: string;
  remaining: number;
  idealRemaining: number;
}

export interface BurndownDataResponse {
  totalTasks: number;
  points: BurndownPoint[];
}

export interface VelocityPoint {
  weekStart: string;
  completed: number;
}

export interface VelocityDataResponse {
  averageVelocity: number;
  points: VelocityPoint[];
}

// ===== Activity Log =====
export interface ChangeDetail {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface ActivityLogResponse {
  id: string;
  action: string;
  description: string;
  username: string;
  taskId: string | null;
  taskTitle: string | null;
  timestamp: string;
  changeDetails?: ChangeDetail[];
}

export interface ActivityLogPageResponse {
  content: ActivityLogResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ===== Comments =====
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

export interface CommentUpdateRequest {
  content: string;
}

// ===== Notifications (Phase 3) =====
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  taskId: string | null;
  actorUsername: string | null;
  targetUsername: string;
  read: boolean;
  createdAt: string;
}

// ===== Tags (Phase 3) =====
export interface TagCreateRequest {
  name: string;
  color?: string;
}

// ===== Attachments (Phase 3) =====
export interface AttachmentResponse {
  id: string;
  taskId: string;
  originalFilename: string;
  storedFilename: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

// ===== User / Admin =====
export type UserRole = 'USER' | 'MANAGER' | 'ADMIN';

export interface UserAdminResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
}

// ===== API Error =====
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  status: number;
  details?: string;
  path?: string;
}

export function isApiError(error: unknown): error is { response: { data: ApiErrorResponse; status: number } } {
  if (typeof error !== 'object' || error === null) return false;
  if (!('response' in error)) return false;
  const resp = (error as Record<string, unknown>).response;
  if (typeof resp !== 'object' || resp === null) return false;
  if (!('data' in resp)) return false;
  return typeof (resp as Record<string, unknown>).data === 'object';
}
