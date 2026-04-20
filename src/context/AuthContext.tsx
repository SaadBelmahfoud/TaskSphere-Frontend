'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api, { setRefreshCallback, setTokenUpdateCallback } from '@/lib/api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const updateAuth = useCallback((newAuth: AuthState) => {
    setAuth(newAuth);
    if (newAuth.isAuthenticated) {
      localStorage.setItem('tasksphere_auth', JSON.stringify(newAuth));
    } else {
      localStorage.removeItem('tasksphere_auth');
    }
  }, []);

  const clearQueryCache = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { clearCache: true } }));
    } catch {
      // Ignore
    }
  }, []);

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

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      } satisfies LoginRequest);

      let emailFromToken = email;
      let roleFromToken = 'USER';

      try {
        const payload = JSON.parse(atob(response.data.accessToken.split('.')[1]));
        emailFromToken = payload.sub || email;
        roleFromToken = payload.role || 'USER';
      } catch {
        // JWT decode failed, keep defaults
      }

      const newAuth: AuthState = {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        email: emailFromToken,
        role: roleFromToken,
        isAuthenticated: true,
        tokenExpiry: Date.now() + parseInt(response.data.expiresIn) * 1000,
      };

      clearQueryCache();
      updateAuth(newAuth);
      toast.success(`Bienvenue, ${emailFromToken} !`, {
        description: `Connecté en tant que ${roleFromToken}`,
      });
      router.push('/tasks');
    } catch (err: unknown) {
      const message = isApiError(err)
        ? err.response.data.error || err.response.data.message || 'Erreur serveur'
        : 'Erreur de connexion au serveur';
      setError(message);
      toast.error('Échec de la connexion', { description: message });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router, updateAuth, clearQueryCache]);

  const logout = useCallback(async () => {
    try {
      if (auth.refreshToken) {
        await api.post('/auth/logout', {
          refreshToken: auth.refreshToken,
        });
      }
    } catch {
      // Even if server logout fails, clear client state
    } finally {
      clearQueryCache();
      updateAuth(defaultAuth);
      toast.info('Déconnecté', { description: 'À bientôt !' });
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
