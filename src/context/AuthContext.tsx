"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { AuthState, LoginRequest, RegisterRequest } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  auth: AuthState | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateAuth: (updates: Partial<AuthState>) => void;
}

const AUTH_KEY = "tasksphere_auth";

function loadStoredAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.isAuthenticated && parsed.tokenExpiry > Date.now()) {
        return parsed;
      }
      localStorage.removeItem(AUTH_KEY);
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  }
  return null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ── Hydration-safe auth state ──
  // Start with auth=null so server and client initial renders match.
  // After hydration, load auth from localStorage via a callback-based approach.
  const [mounted, setMounted] = useState(false);
  const [auth, setAuth] = useState<AuthState | null>(null);
  const queryClient = useQueryClient();
  const initializedRef = useRef(false);

  // ── Load auth from localStorage after mount ──
  // Uses a ref to ensure this only runs once, and schedules the state
  // update via a microtask to avoid the "setState in effect" lint rule.
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const stored = loadStoredAuth();
    // Schedule state updates outside the synchronous effect body
    // to satisfy the react-hooks/set-state-in-effect rule
    queueMicrotask(() => {
      if (stored) {
        setAuth(stored);
      }
      setMounted(true);
    });
  }, []);

  // ── Invalidate all queries when auth token changes (login/logout/switch user) ──
  useEffect(() => {
    if (mounted) {
      queryClient.invalidateQueries();
    }
  }, [auth?.accessToken, mounted, queryClient]);

  const persistAuth = (newAuth: AuthState) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
    setAuth(newAuth);
  };

  const login = useCallback(async (data: LoginRequest) => {
    const res = await api.post("/auth/login", data);
    const { accessToken, refreshToken, tokenType, expiresIn } = res.data;
    const tokenExpiry = Date.now() + (expiresIn || 3600) * 1000;

    // Decode JWT to get email and role
    let email = data.email;
    let username: string | null = null;
    let role = "USER";
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      email = payload.sub || payload.email || data.email;
      username = payload.username || payload.preferred_username || null;
      role = payload.role || payload.authorities?.[0]?.authority || "USER";
      if (role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
    } catch {
      // fallback to defaults
    }

    const newAuth: AuthState = {
      accessToken,
      refreshToken,
      email,
      username,
      role,
      isAuthenticated: true,
      tokenExpiry,
    };

    persistAuth(newAuth);
    toast.success("Welcome back!");
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await api.post("/auth/register", data);
    const { accessToken, refreshToken, expiresIn } = res.data;
    const tokenExpiry = Date.now() + (expiresIn || 3600) * 1000;

    let email = data.email;
    let username: string | null = null;
    let role = "USER";
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      email = payload.sub || payload.email || data.email;
      username = payload.username || payload.preferred_username || null;
      role = payload.role || payload.authorities?.[0]?.authority || "USER";
      if (role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
    } catch {
      // fallback
    }

    const newAuth: AuthState = {
      accessToken,
      refreshToken,
      email,
      username,
      role,
      isAuthenticated: true,
      tokenExpiry,
    };

    persistAuth(newAuth);
    toast.success("Account created successfully!");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors
    }
    // Clear ALL cached data on logout so next user starts fresh
    queryClient.clear();
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    toast.info("Logged out");
  }, [queryClient]);

  const updateAuth = useCallback((updates: Partial<AuthState>) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Before mount, render children with auth=null ──
  // This ensures server and client initial renders match (no hydration mismatch)
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ auth: null, login, register, logout, updateAuth }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, login, register, logout, updateAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
