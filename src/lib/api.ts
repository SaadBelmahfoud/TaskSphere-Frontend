import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthState } from '@/types';

// ===== Client Axios avec intercepteur JWT + auto-refresh =====

const api = axios.create({
  baseURL: '/api/v1', // Proxied via Next.js rewrites → localhost:8080
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ===== Callback de refresh token (injecté par AuthContext) =====
let refreshCallback: (() => Promise<AuthState | null>) | null = null;

export function setRefreshCallback(cb: (() => Promise<AuthState | null>) | null) {
  refreshCallback = cb;
}

// ===== Callback de mise à jour du token dans le state =====
let tokenUpdateCallback: ((state: AuthState) => void) | null = null;

export function setTokenUpdateCallback(cb: ((state: AuthState) => void) | null) {
  tokenUpdateCallback = cb;
}

// ===== Lecture du token courant =====
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

// ===== Intercepteur requête : injecte le Bearer token =====
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

// ===== Intercepteur réponse : auto-refresh si 401 =====
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

    // Si 401 et pas déjà en cours de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // On attend que le refresh en cours se termine
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
          // Refresh a échoué → déconnexion
          processQueue(new Error('Refresh failed'), null);
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
          }
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return Promise.reject(error);
        }

        processQueue(null, newAuthState.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAuthState.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
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
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
