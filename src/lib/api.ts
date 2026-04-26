import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthState, RegisterRequest, LoginResponse } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// JWT + AUTO-REFRESH ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════
//
// 2 Axios instances:
//   - api          : Bearer interceptor + auto-refresh on 401
//   - refreshApi   : SEPARATE instance, WITHOUT interceptor
//                    Used ONLY for POST /auth/refresh
//                    (avoids sending expired token in header)
//
// Refresh flow:
//   1. Request → 401 → response interceptor
//   2. Interceptor calls refreshCallback() via refreshApi (WITHOUT Bearer)
//   3. Backend validates refreshToken → returns new accessToken
//   4. Interceptor updates header → retry original request
// ═══════════════════════════════════════════════════════════════════

// ===== Main instance (with interceptors) =====
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ===== SEPARATE instance for refresh (WITHOUT Bearer interceptor) =====
export const refreshApi = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ===== Callbacks injected by AuthContext =====
let refreshCallback: (() => Promise<AuthState | null>) | null = null;
export function setRefreshCallback(cb: (() => Promise<AuthState | null>) | null) {
  refreshCallback = cb;
}

let tokenUpdateCallback: ((state: AuthState) => void) | null = null;
export function setTokenUpdateCallback(cb: ((state: AuthState) => void) | null) {
  tokenUpdateCallback = cb;
}

// ===== Read token from localStorage =====
export function getCurrentToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('tasksphere_auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AuthState;
    return parsed.accessToken;
  } catch {
    return null;
  }
}

// ===== Request interceptor: inject Bearer token =====
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCurrentToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ===== Response interceptor: auto-refresh on 401 =====
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;

    // Only 401 triggers refresh (authentication error)
    // 403 is a business error (permission denied) → no refresh
    if (status === 401 && !originalRequest?._retry) {
      console.log(`[TaskSphere API] 401 on ${originalRequest?.url} — Attempting refresh...`);

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (!refreshCallback) {
          throw new Error('No refresh callback configured');
        }

        const newAuthState = await refreshCallback();

        if (!newAuthState?.accessToken) {
          console.error('[TaskSphere API] Refresh failed — no new token');
          processQueue(new Error('Refresh failed'), null);
          forceLogout();
          return Promise.reject(error);
        }

        console.log('[TaskSphere API] Refresh successful — new token obtained');
        processQueue(null, newAuthState.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAuthState.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.error('[TaskSphere API] Refresh failed with error:', refreshError);
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ===== Force logout =====
function forceLogout() {
  if (tokenUpdateCallback) {
    tokenUpdateCallback({
      accessToken: null,
      refreshToken: null,
      email: null,
      role: null,
      isAuthenticated: false,
      tokenExpiry: null,
    });
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tasksphere_auth');
    window.location.href = '/';
  }
}

// ===== Register function =====
export async function register(data: RegisterRequest) {
  const response = await api.post<LoginResponse>('/auth/register', data);
  return response.data;
}

export default api;
