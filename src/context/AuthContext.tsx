'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api, { setRefreshCallback, setTokenUpdateCallback, refreshApi } from '@/lib/api';
import { isApiError } from '@/types';
import { AuthState, LoginRequest, LoginResponse } from '@/types';

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const defaultAuth: AuthState = {
  accessToken: null,
  refreshToken: null,
  email: null,
  role: null,
  isAuthenticated: false,
  tokenExpiry: null,
};

const AuthContext = createContext<AuthContextType>({
  auth: defaultAuth,
  login: async () => {},
  logout: async () => {},
  isLoading: false,
  error: null,
  clearError: () => {},
});

const AUTH_STORAGE_KEY = 'tasksphere_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ===== Hydrate from localStorage on mount =====
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.accessToken && parsed.tokenExpiry && parsed.tokenExpiry > Date.now()) {
          setAuth(parsed);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== Update state + localStorage =====
  const updateAuth = useCallback((newAuth: AuthState) => {
    setAuth(newAuth);
    if (newAuth.isAuthenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  // ===== Clear React Query cache =====
  const clearQueryCache = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { clearCache: true } }));
    } catch {
      // Ignore
    }
  }, []);

  // ===== Refresh token callback =====
  useEffect(() => {
    setRefreshCallback(async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as AuthState;
        if (!parsed.refreshToken) return null;

        // Use refreshApi (SEPARATE instance, WITHOUT Bearer interceptor)
        const response = await refreshApi.post<LoginResponse>('/auth/refresh', {
          refreshToken: parsed.refreshToken,
        });

        if (!response.data?.accessToken) return null;

        const expiresInMs = parseInt(response.data.expiresIn, 10) * 1000 || 3600_000;
        const newAuth: AuthState = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          email: parsed.email,
          role: parsed.role,
          isAuthenticated: true,
          tokenExpiry: Date.now() + expiresInMs,
        };

        updateAuth(newAuth);
        return newAuth;
      } catch {
        return null;
      }
    });

    setTokenUpdateCallback((newAuth: AuthState) => {
      updateAuth(newAuth);
    });

    return () => {
      setRefreshCallback(null);
      setTokenUpdateCallback(null);
    };
  }, [updateAuth]);

  // ===== LOGIN =====
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      } satisfies LoginRequest);

      if (!response.data?.accessToken || !response.data?.refreshToken) {
        throw new Error('Invalid login response: missing token');
      }

      // Decode JWT to extract email + role
      let emailFromToken = email;
      let roleFromToken = 'USER';
      try {
        const base64Payload = response.data.accessToken.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        emailFromToken = payload.sub || email;
        roleFromToken = payload.role || 'USER';
      } catch {
        // JWT decode failed, keep defaults
      }

      const expiresInMs = parseInt(response.data.expiresIn, 10) * 1000 || 3600_000;
      const newAuth: AuthState = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        email: emailFromToken,
        role: roleFromToken,
        isAuthenticated: true,
        tokenExpiry: Date.now() + expiresInMs,
      };

      clearQueryCache();
      updateAuth(newAuth);
      toast.success(`Welcome, ${emailFromToken}!`, {
        description: `Logged in as ${roleFromToken}`,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = isApiError(err)
        ? err.response.data.error || err.response.data.message || 'Server error'
        : err instanceof Error
          ? err.message
          : 'Connection error';
      setError(message);
      toast.error('Login failed', { description: message });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router, updateAuth, clearQueryCache]);

  // ===== LOGOUT =====
  const logout = useCallback(async () => {
    try {
      if (auth.refreshToken) {
        await refreshApi.post('/auth/logout', {
          refreshToken: auth.refreshToken,
        });
      }
    } catch {
      // Server might be unreachable, clean up anyway
    } finally {
      clearQueryCache();
      updateAuth(defaultAuth);
      toast.info('Logged out', { description: 'See you soon!' });
      router.push('/');
    }
  }, [auth.refreshToken, router, updateAuth, clearQueryCache]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
