import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthState, RegisterRequest, LoginResponse } from '@/types';

// ═══════════════════════════════════════════════════════════════════
// ARCHITECTURE JWT + AUTO-REFRESH
// ═══════════════════════════════════════════════════════════════════
//
// 2 instances Axios :
//   - api          : intercepteur Bearer + auto-refresh sur 401
//   - refreshApi   : instance SÉPARÉE, SANS intercepteur
//                    Utilisée UNIQUEMENT pour POST /auth/refresh
//                    (évite d'envoyer un token expiré dans le header)
//
// Flux de refresh :
//   1. Requête → 401 → intercepteur réponse
//   2. Interceptor appelle refreshCallback() via refreshApi (SANS Bearer)
//   3. Backend valide le refreshToken → retourne nouveau accessToken
//   4. Interceptor met à jour le header → retry la requête originale
// ═══════════════════════════════════════════════════════════════════

// ===== Instance principale (avec intercepteurs) =====
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ===== Instance SÉPARÉE pour le refresh (SANS intercepteur Bearer) =====
// CRITICAL: Cette instance n'attache PAS le Authorization header.
// Le refresh endpoint (/api/v1/auth/refresh) est permitAll() dans Spring Security,
// il n'a besoin que du refreshToken dans le body JSON.
export const refreshApi = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ===== Callbacks injectés par AuthContext =====
let refreshCallback: (() => Promise<AuthState | null>) | null = null;
export function setRefreshCallback(cb: (() => Promise<AuthState | null>) | null) {
  refreshCallback = cb;
}

let tokenUpdateCallback: ((state: AuthState) => void) | null = null;
export function setTokenUpdateCallback(cb: ((state: AuthState) => void) | null) {
  tokenUpdateCallback = cb;
}

// ===== Lecture du token depuis localStorage =====
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

// ===== Intercepteur requête : injecte Bearer token =====
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

// ===== Intercepteur réponse : auto-refresh sur 401 =====
//
// Le backend retourne maintenant 401 (pas 403) grâce au fix de SecurityConfig
// (AuthenticationEntryPoint custom). Donc on ne traite que le 401.
//
// Les 403 sont maintenant exclusivement des erreurs métier (permission refusée
// par le contrôleur), ils ne déclenchent PAS de refresh.

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

    // Seul le 401 déclenche le refresh (erreur d'authentification)
    // Le 403 est une erreur métier (permission refusée) → pas de refresh
    if (status === 401 && !originalRequest?._retry) {
      console.log(`[TaskSphere API] 401 sur ${originalRequest?.url} — Tentative de refresh...`);

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
          console.error('[TaskSphere API] Refresh échoué — pas de nouveau token');
          processQueue(new Error('Refresh failed'), null);
          forceLogout();
          return Promise.reject(error);
        }

        console.log('[TaskSphere API] Refresh réussi — nouveau token obtenu');
        processQueue(null, newAuthState.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAuthState.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.error('[TaskSphere API] Refresh échoué avec erreur:', refreshError);
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

// ===== Force la déconnexion =====
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

// ===== Fonction d'inscription =====
export async function register(data: RegisterRequest) {
  const response = await api.post<LoginResponse>('/auth/register', data);
  return response.data;
}

export default api;
