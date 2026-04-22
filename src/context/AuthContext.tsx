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

  // ===== Hydratation depuis localStorage au mount =====
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

  // ===== Mise à jour du state + localStorage =====
  const updateAuth = useCallback((newAuth: AuthState) => {
    setAuth(newAuth);
    if (newAuth.isAuthenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  // ===== Nettoyage du cache React Query =====
  const clearQueryCache = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('auth-change', { detail: { clearCache: true } }));
    } catch {
      // Ignore
    }
  }, []);

  // ===== Callback de refresh token =====
  // CRITICAL: utilise refreshApi (SANS intercepteur Bearer) pour appeler /auth/refresh
  useEffect(() => {
    setRefreshCallback(async () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as AuthState;
        if (!parsed.refreshToken) return null;

        // Utiliser refreshApi (instance SÉPARÉE, SANS intercepteur Bearer)
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
        throw new Error('Réponse de login invalide: token manquant');
      }

      // Décoder le JWT pour extraire email + rôle
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
      toast.success(`Bienvenue, ${emailFromToken} !`, {
        description: `Connecté en tant que ${roleFromToken}`,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = isApiError(err)
        ? err.response.data.error || err.response.data.message || 'Erreur serveur'
        : err instanceof Error
          ? err.message
          : 'Erreur de connexion au serveur';
      setError(message);
      toast.error('Échec de la connexion', { description: message });
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, [router, updateAuth, clearQueryCache]);

  // ===== LOGOUT =====
  const logout = useCallback(async () => {
    try {
      if (auth.refreshToken) {
        // Utiliser refreshApi pour le logout aussi (pas besoin de Bearer)
        await refreshApi.post('/auth/logout', {
          refreshToken: auth.refreshToken,
        });
      }
    } catch {
      // Le serveur peut être injoignable, on nettoie quand même
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
