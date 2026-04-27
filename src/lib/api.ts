import axios from "axios";

// Backend port — Spring Boot runs on 8080
const BACKEND_PORT = 8080;

const api = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — add XTransformPort for Caddy gateway + attach Bearer token
api.interceptors.request.use(
  (config) => {
    // Add XTransformPort query param so Caddy routes to the backend
    const separator = config.url?.includes("?") ? "&" : "?";
    config.url = `${config.url}${separator}XTransformPort=${BACKEND_PORT}`;

    // Attach Bearer token
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

// Response interceptor — auto-refresh on 401
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

        // Use direct axios (not api instance) with XTransformPort for refresh
        const res = await axios.post(
          `/api/v1/auth/refresh?XTransformPort=${BACKEND_PORT}`,
          { refreshToken }
        );
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
