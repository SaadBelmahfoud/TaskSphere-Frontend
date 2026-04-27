"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { AuthState, LoginRequest, RegisterRequest } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";

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
  const [auth, setAuth] = useState<AuthState | null>(loadStoredAuth);

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
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    toast.info("Logged out");
  }, []);

  const updateAuth = useCallback((updates: Partial<AuthState>) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

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
