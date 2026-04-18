'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api, { setRefreshCallback, setTokenUpdateCallback } from '@/lib/api';
import {
  AuthState,
  LoginRequest,
  LoginResponse,
} from '@/types';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ===== Chargement initial du state depuis localStorage =====
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tasksphere_auth');
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState;
        if (parsed.accessToken && parsed.tokenExpiry && parsed.tokenExpiry > Date.now()) {
          setAuth(parsed);
        } else {
          localStorage.removeItem('tasksphere_auth');
        }
      }
    } catch {
      localStorage.removeItem('tasksphere_auth');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===== Persister le state dans localStorage =====
  const updateAuth = useCallback((newAuth: AuthState) => {
    setAuth(newAuth);
    if (newAuth.isAuthenticated) {
      localStorage.setItem('tasksphere_auth', JSON.stringify(newAuth));
    } else {
      localStorage.removeItem('tasksphere_auth');
    }
  }, []);

  // ===== Configurer les callbacks pour l'intercepteur Axios =====
  useEffect(() => {
    setRefreshCallback(async () => {
      try {
        const stored = localStorage.getItem('tasksphere_auth');
        if (!stored) return null;
        const parsed = JSON.parse(stored) as AuthState;
        if (!parsed.refreshToken) return null;

        const response = await api.post<LoginResponse>('/auth/refresh', {
          refreshToken: parsed.refreshToken,
        });

        const newAuth: AuthState = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          email: parsed.email,
          role: parsed.role,
          isAuthenticated: true,
          tokenExpiry: Date.now() + parseInt(response.data.expiresIn) * 1000,
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

  // ===== Login =====
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      } satisfies LoginRequest);

      // Décoder le JWT pour extraire email et role
      let emailFromToken = email;
      let roleFromToken = 'USER';

      try {
        const payload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
        emailFromToken = payload.sub || email;
        roleFromToken = payload.role || 'USER';
      } catch {
        // Si le décodage échoue, on garde les valeurs par défaut
      }

      const newAuth: AuthState = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        email: emailFromToken,
        role: roleFromToken,
        isAuthenticated: true,
        tokenExpiry: Date.now() + parseInt(response.data.expiresIn) * 1000,
      };

      updateAuth(newAuth);
      router.push('/tasks');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const message = axiosErr?.response?.data?.error || 'Erreur de connexion au serveur';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router, updateAuth]);

  // ===== Logout =====
  const logout = useCallback(async () => {
    try {
      if (auth.refreshToken) {
        await api.post('/auth/logout', {
          refreshToken: auth.refreshToken,
        });
      }
    } catch {
      // Même si le logout échoue côté serveur, on clear côté client
    } finally {
      updateAuth(defaultAuth);
      router.push('/');
    }
  }, [auth.refreshToken, router, updateAuth]);

  // ===== Clear error =====
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
