// ===== Types basés sur le code réel du backend =====

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
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
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

export interface LoginRequest {
  email: string;
  password: string;
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

export interface ApiError {
  error?: string;
  message?: string;
  status: number;
}
