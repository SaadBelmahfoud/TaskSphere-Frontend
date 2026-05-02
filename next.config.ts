import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // P0-3 FIX: Removed ignoreBuildErrors — TypeScript errors must be
  // fixed, not silenced. Build should fail on type errors.
  reactStrictMode: false,
  // ═══════════════════════════════════════════════════════════════════
  // API PROXY — All /api/v1/* requests are proxied to the Spring Boot
  // backend via the catch-all route handler at:
  //   src/app/api/v1/[...path]/route.ts
  //
  // NOTE: We do NOT use next.config.ts rewrites() here because:
  //   - rewrites() has HIGHER priority than route handlers
  //   - rewrites() silently fails with Turbopack in some cases
  //   - The route handler provides better error handling and logging
  //
  // EN DOCKER : set BACKEND_URL=http://backend:8080 in .env
  // ═══════════════════════════════════════════════════════════════════
};

export default nextConfig;
