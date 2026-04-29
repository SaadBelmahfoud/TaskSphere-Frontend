import axios from "axios";

/**
 * ═══════════════════════════════════════════════════════════════════
 * CONFIGURATION API — Communication Frontend ↔ Backend
 * ═══════════════════════════════════════════════════════════════════
 *
 * PRINCIPE : Le frontend Next.js communique avec le backend Spring Boot
 * via l'API REST. Deux modes de fonctionnement existent :
 *
 * MODE LOCAL (développement) :
 * ────────────────────────────
 * Next.js agit comme un reverse-proxy via les rewrites dans next.config.ts.
 * Le navigateur envoie /api/v1/* → Next.js rewrite → http://localhost:8080/api/v1/*
 * Pas besoin de XTransformPort car Next.js gère le routage.
 *
 * MODE SANDBOX (déploiement Cloud) :
 * ──────────────────────────────────
 * Un gateway Caddy est utilisé. Le navigateur envoie /api/v1/*?XTransformPort=8080.
 * Caddy lit le paramètre XTransformPort et route vers le bon port.
 * Ce mode est détecté automatiquement via la variable d'environnement NEXT_PUBLIC_API_MODE.
 *
 * JETON JWT (Bearer Token) :
 * ──────────────────────────
 * Chaque requête authentifiée inclut le header :
 *   Authorization: Bearer <accessToken>
 * Le token est stocké dans localStorage sous la clé "tasksphere_auth".
 *
 * REFRESH TOKEN (Rotation) :
 * ──────────────────────────
 * Quand le JWT expire (401), l'intercepteur tente un refresh automatique
 * en envoyant le refreshToken au endpoint /auth/refresh.
 * Pattern : Refresh Token Rotation — un nouveau refresh token est émis à chaque refresh.
 *
 * ═══════════════════════════════════════════════════════════════════
 * SCHÉMA DE COMMUNICATION FRONTEND ↔ BACKEND
 * ═══════════════════════════════════════════════════════════════════
 *
 * ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
 * │ Navigateur│ ──→ │ Next.js      │ ──→ │ Spring Boot  │ ──→ │ Database │
 * │ (React)  │ ←── │ (Proxy/SSR)  │ ←── │ (REST API)   │ ←── │ (H2/PG) │
 * └──────────┘     └──────────────┘     └──────────────┘     └──────────┘
 *      │                   │                    │
 *      │  POST /api/v1/    │  http://localhost   │  JDBC
 *      │  auth/login       │  :8080/api/v1/     │  SELECT...
 *      │  {email,password} │  auth/login        │
 *      │                   │  {email,password}   │
 *      │                   │                    │
 *      │  ← JWT tokens     │  ← JWT tokens      │
 *      └───────────────────┘────────────────────┘
 *
 * FLUX D'AUTHENTIFICATION COMPLET :
 * ─────────────────────────────────
 * 1. L'utilisateur saisit email + mot de passe
 * 2. Le frontend envoie POST /api/v1/auth/login {email, password}
 * 3. Le backend vérifie les credentials (BCrypt)
 * 4. Le backend génère accessToken (JWT 1h) + refreshToken (opaque 7j)
 * 5. Le frontend stocke les tokens dans localStorage
 * 6. Chaque requête suivante inclut Authorization: Bearer <accessToken>
 * 7. Si le JWT expire (401), le frontend fait automatiquement un refresh
 * 8. Au logout, le frontend envoie le refreshToken pour révocation côté serveur
 */

// Backend port — Spring Boot runs on 8080
const BACKEND_PORT = 8080;

/**
 * DÉTECTION DU MODE D'EXÉCUTION :
 * - "sandbox" = utilisation du gateway Caddy avec XTransformPort
 * - "local" (défaut) = utilisation du proxy Next.js (rewrites)
 *
 * PRINCIPE : La variable NEXT_PUBLIC_API_MODE est définie dans .env.local
 * ou dans l'environnement du conteneur. Le préfixe NEXT_PUBLIC_ est
 * requis par Next.js pour exposer la variable côté client.
 */
const API_MODE = process.env.NEXT_PUBLIC_API_MODE || "local";

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ═══════════════════════════════════════════════════════════════════
// INTERCEPTEUR DE REQUÊTE (Request Interceptor)
// ═══════════════════════════════════════════════════════════════════
// Exécuté AVANT chaque requête HTTP. Deux responsabilités :
// 1. Ajouter XTransformPort si en mode sandbox
// 2. Attacher le Bearer token depuis localStorage
api.interceptors.request.use(
  (config) => {
    // ═══════════════════════════════════════════════════════
    // MODE SANDBOX : Ajouter XTransformPort pour le gateway Caddy
    // ═══════════════════════════════════════════════════════
    // En mode local, Next.js rewrites gère le proxy automatiquement.
    // En mode sandbox, Caddy utilise XTransformPort pour router.
    if (API_MODE === "sandbox") {
      const separator = config.url?.includes("?") ? "&" : "?";
      config.url = `${config.url}${separator}XTransformPort=${BACKEND_PORT}`;
    }

    // ═══════════════════════════════════════════════════════
    // JETON JWT : Attacher le Bearer token à chaque requête
    // ═══════════════════════════════════════════════════════
    // Le token est récupéré depuis localStorage.
    // Il est envoyé dans le header Authorization au format Bearer.
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tasksphere_auth");
      if (stored) {
        try {
          const auth = JSON.parse(stored);
          if (auth.accessToken) {
            config.headers.Authorization = `Bearer ${auth.accessToken}`;
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════════
// INTERCEPTEUR DE RÉPONSE (Response Interceptor) — Auto-refresh sur 401
// ═══════════════════════════════════════════════════════════════════
//
// PRINCIPE DU REFRESH AUTOMATIQUE :
// ──────────────────────────────────
// Quand le backend retourne 401 (JWT expiré), cet intercepteur :
// 1. Prend le refreshToken depuis localStorage
// 2. Appelle POST /api/v1/auth/refresh { refreshToken }
// 3. Le backend vérifie le refresh token, le révoque, et en crée un nouveau
// 4. Le frontend met à jour les tokens dans localStorage
// 5. La requête originale est retentée avec le nouveau JWT
//
// PATTERN "FAILED QUEUE" :
// ────────────────────────
// Si plusieurs requêtes échouent simultanément (401), on ne fait qu'un seul
// refresh. Les autres requêtes sont mises en file d'attente (failedQueue).
// Une fois le refresh terminé, toutes les requêtes en attente sont résolues
// avec le nouveau token.
//
// Pourquoi ? Si on lance N refresh en parallèle, le premier réussit,
// mais les N-1 autres échouent car le refresh token a été révoqué (rotation).
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const stored = localStorage.getItem("tasksphere_auth");
        if (!stored) throw new Error("No auth data");

        const auth = JSON.parse(stored);
        const { refreshToken } = auth;

        if (!refreshToken) throw new Error("No refresh token");

        // Appel de refresh — adapte l'URL selon le mode (local vs sandbox)
        const refreshUrl = API_MODE === "sandbox"
          ? `/api/v1/auth/refresh?XTransformPort=${BACKEND_PORT}`
          : "/api/v1/auth/refresh";

        // Use direct axios (not api instance) to avoid infinite interceptor loop
        const res = await axios.post(refreshUrl, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        const newExpiry = Date.now() + (res.data.expiresIn || 3600) * 1000;

        const updatedAuth = {
          ...auth,
          accessToken,
          refreshToken: newRefreshToken || refreshToken,
          tokenExpiry: newExpiry,
        };

        localStorage.setItem("tasksphere_auth", JSON.stringify(updatedAuth));
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("tasksphere_auth");
        if (typeof window !== "undefined") {
          window.location.href = "/";
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
