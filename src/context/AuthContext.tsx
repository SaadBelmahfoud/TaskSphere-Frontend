"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { AuthState, LoginRequest, RegisterRequest } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";

/**
 * ═══════════════════════════════════════════════════════════════════
 * CONTEXTE D'AUTHENTIFICATION — AuthContext
 * ═══════════════════════════════════════════════════════════════════
 *
 * RÔLE : Fournir l'état d'authentification à TOUTE l'application React.
 * N'IMPORTE QUEL composant peut accéder à l'utilisateur connecté,
 * son rôle, et ses tokens via le hook useAuth().
 *
 * PATTERN : Context + Provider (React)
 * ────────────────────────────────────
 * ┌──────────────────────────────────────────────────────┐
 * │  AuthProvider (entoure l'app dans layout.tsx)        │
 * │  ┌──────────────────────────────────────────────────┐│
 * │  │  useAuth() ← accessible dans tous les composants ││
 * │  │  → auth.email, auth.role, login(), logout()...   ││
 * │  └──────────────────────────────────────────────────┘│
 * └──────────────────────────────────────────────────────┘
 *
 * DONNÉES STOCKÉES DANS localStorage :
 * ──────────────────────────────────────
 * Clé : "tasksphere_auth"
 * Valeur : {
 *   accessToken: "eyJhbGciOiJIUzI1NiJ9...",  // JWT (1h)
 *   refreshToken: "550e8400-e29b-41d4...",     // UUID opaque (7j)
 *   email: "saadoune@tasksphere.com",
 *   username: "saadoune",
 *   role: "USER",
 *   isAuthenticated: true,
 *   tokenExpiry: 1719480000000                  // timestamp ms
 * }
 *
 * POURQUOI localStorage ET PAS cookies ?
 * ──────────────────────────────────────
 * - Le backend Spring Boot utilise des JWT stateless (pas de session)
 * - Le frontend gère le stockage côté client
 * - localStorage persiste entre les onglets et les rechargements
 * - Alternative : httpOnly cookies (plus sécurisé contre XSS)
 *   mais nécessite un backend qui gère les cookies
 *
 * ═══════════════════════════════════════════════════════════════════
 * FLUX D'AUTHENTIFICATION COMPLET (LOGIN)
 * ═══════════════════════════════════════════════════════════════════
 *
 * ┌────────┐   POST /api/v1/auth/login    ┌──────────────┐
 * │ Login  │ ────────────────────────────→ │ Spring Boot  │
 * │ Page   │   { email, password }         │ AuthController│
 * │        │ ←──────────────────────────── │              │
 * │        │   { accessToken, refreshToken,│              │
 * │        │     tokenType, expiresIn }    │              │
 * └────────┘                               └──────────────┘
 *      │
 *      ▼
 * ┌────────────────────────────────────────────────────────┐
 * │ 1. Décoder le JWT (Base64 payload) pour extraire :     │
 * │    - sub (email) : "saadoune@tasksphere.com"          │
 * │    - role : "USER"                                     │
 * │ 2. Stocker tout dans localStorage                      │
 * │ 3. Mettre à jour le state React                        │
 * │ 4. Rediriger vers /dashboard                           │
 * └────────────────────────────────────────────────────────┘
 *
 * DÉCODAGE JWT CÔTÉ CLIENT :
 * ──────────────────────────
 * Le JWT est encodé en Base64 (PAS chiffré — ne JAMAIS y mettre de secrets).
 * Structure : header.payload.signature
 * Le payload contient : { "sub": "email@x.com", "role": "USER", "iat": ..., "exp": ... }
 * On le décode avec : JSON.parse(atob(token.split(".")[1]))
 *
 * ⚠️ ATTENTION : Le décodage côté client sert UNIQUEMENT à afficher
 * les infos utilisateur. La VÉRIFICATION de la signature se fait
 * CÔTÉ SERVEUR uniquement (clé secrète).
 */

interface AuthContextType {
  auth: AuthState | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateAuth: (updates: Partial<AuthState>) => void;
}

const AUTH_KEY = "tasksphere_auth";

/**
 * Charge l'état d'authentification depuis localStorage.
 * Vérifie que le token n'est pas expiré (tokenExpiry > maintenant).
 * Si expiré → supprime les données et retourne null.
 */
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

  /** Persiste l'état d'auth dans localStorage ET dans le state React */
  const persistAuth = (newAuth: AuthState) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(newAuth));
    setAuth(newAuth);
  };

  /**
   * LOGIN — Connexion avec email + mot de passe.
   *
   * CORRESPONDANCE AVEC LE BACKEND :
   * ─────────────────────────────────
   * Endpoint : POST /api/v1/auth/login
   * Body (Map<String, String>) : { "email": "...", "password": "..." }
   * Réponse (200) : { "accessToken", "refreshToken", "tokenType", "expiresIn" }
   * Erreur (401) : { "error": "Email ou mot de passe incorrect" }
   * Erreur (403) : { "error": "Compte désactivé" }
   *
   * POINT CLÉ : Le backend attend "email" comme clé dans le Map,
   * et c'est bien un email (pas un username). Le frontend envoie
   * exactement { email, password } → le backend fait userRepository.findByEmail(email).
   */
  const login = useCallback(async (data: LoginRequest) => {
    const res = await api.post("/auth/login", data);
    const { accessToken, refreshToken, expiresIn } = res.data;
    const tokenExpiry = Date.now() + (expiresIn || 3600) * 1000;

    // ═══════════════════════════════════════════════════════
    // DÉCODAGE JWT : Extraire email et role du token
    // ═══════════════════════════════════════════════════════
    // Le JWT est : header.payload.signature
    // Le payload (index 1) est encodé en Base64URL.
    // atob() décode le Base64 en chaîne JSON.
    // On extrait : sub (email), role
    let email = data.email;
    let username: string | null = null;
    let role = "USER";
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      // sub = le subject du JWT = l'email (généré par JwtService.generateAccessToken(email, role))
      email = payload.sub || payload.email || data.email;
      username = payload.username || payload.preferred_username || null;
      role = payload.role || payload.authorities?.[0]?.authority || "USER";
      if (role.startsWith("ROLE_")) role = role.replace("ROLE_", "");
    } catch {
      // fallback to defaults (si le décodage échoue, on utilise les données du formulaire)
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

  /**
   * REGISTER — Inscription d'un nouvel utilisateur.
   *
   * CORRESPONDANCE AVEC LE BACKEND :
   * ─────────────────────────────────
   * Endpoint : POST /api/v1/auth/register
   * Body (RegisterRequest) : { username, firstName, lastName, email, password, confirmPassword }
   * Réponse (201) : { "message", "accessToken", "refreshToken", "tokenType", "expiresIn",
   *                   "user": { "username", "email", "role" } }
   * Erreur (400) : { "error": "Les mots de passe ne correspondent pas" }
   * Erreur (409) : { "error": "Un compte avec cet email ou ce nom d'utilisateur existe déjà" }
   *
   * NOTE : L'inscription retourne aussi un objet "user" avec username, email, role.
   * On l'utilise comme fallback si le décodage JWT échoue.
   */
  const register = useCallback(async (data: RegisterRequest) => {
    const res = await api.post("/auth/register", data);
    const { accessToken, refreshToken, expiresIn, user } = res.data;
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
      // fallback: utiliser les données du formulaire
    }

    // Fallback : utiliser les données retournées par le backend dans "user"
    if (!username && user?.username) username = user.username;
    if (role === "USER" && user?.role) role = user.role;

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

  /**
   * LOGOUT — Déconnexion.
   *
   * CORRESPONDANCE AVEC LE BACKEND :
   * ─────────────────────────────────
   * Endpoint : POST /api/v1/auth/logout
   * Body (Map<String, String>) : { "refreshToken": "..." }
   * Réponse (200) : { "message": "Déconnexion réussie" }
   *
   * CORRECTION CRITIQUE (Sprint 5) :
   * ─────────────────────────────────
   * AVANT : api.post("/auth/logout") sans body → le backend reçoit un Map vide
   *         → refreshToken = null → 400 Bad Request "Refresh token manquant"
   *         → Les tokens NE SONT PAS révoqués côté serveur !
   *
   * APRÈS : api.post("/auth/logout", { refreshToken }) → le backend reçoit
   *         le refresh token → il le vérifie → il révoque TOUS les tokens
   *         de l'utilisateur → sécurité garantie.
   *
   * PRINCIPE DE SÉCURITÉ :
   * Même si la révocation côté serveur échoue (erreur réseau, etc.),
   * on supprime TOUJOURS les tokens côté client (localStorage.removeItem).
   * Le JWT expirera naturellement après 1h maximum.
   */
  const logout = useCallback(async () => {
    try {
      // Récupérer le refresh token pour le envoyer au backend
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        if (authData.refreshToken) {
          await api.post("/auth/logout", { refreshToken: authData.refreshToken });
        }
      }
    } catch {
      // ignore logout errors — on supprime quand même les tokens côté client
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
