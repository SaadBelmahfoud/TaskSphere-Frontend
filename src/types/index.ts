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

// ===== Filtres avancés pour les tâches =====
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

// ===== Interface d'erreur API standardisée =====
// Représente la structure des réponses d'erreur du GlobalExceptionHandler backend.

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  status: number;
  details?: string;
  path?: string;
}

// ===== Type Guard isApiError (Correction B1/B2) =====
// Avant : const err = error as { response?: { data?: { message?: string } } };
// Après : if (isApiError(error)) { ... } — type-safe à l'exécution

export function isApiError(error: unknown): error is { response: { data: ApiErrorResponse; status: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response === 'object' &&
    (error as any).response !== null &&
    'data' in (error as any).response &&
    typeof (error as any).response.data === 'object'
  );
}
