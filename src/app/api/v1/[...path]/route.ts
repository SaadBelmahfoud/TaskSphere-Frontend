// ═══════════════════════════════════════════════════════════════════
// API PROXY — Catch-all route handler that proxies all /api/v1/*
// requests to the Spring Boot backend.
//
// This is MORE RELIABLE than next.config.ts rewrites() because:
//   1. Works correctly with Turbopack (rewrites can fail silently)
//   2. Explicit server-side HTTP forwarding — no edge-case routing
//   3. Preserves all headers, status codes, and response bodies
//   4. Proper error handling with meaningful messages
//
// BACKEND_URL env var controls the target (default: http://localhost:8080)
// In Docker: set BACKEND_URL=http://backend:8080
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

/**
 * Generic proxy helper — forwards a request to the backend
 * and returns the backend's response as-is (status, headers, body).
 */
async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  // Build the target URL: /api/v1/auth/login → http://localhost:8080/api/v1/auth/login
  const { pathname, search } = req.nextUrl;
  const targetUrl = `${BACKEND_URL}${pathname}${search}`;

  // Clone headers from the incoming request, forwarding auth & content-type
  // FIX: Also forward the Cookie header so HttpOnly cookie-based auth works
  // through the proxy (the backend needs to see the browser's cookies).
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    // Skip hop-by-hop headers that should not be forwarded
    const lower = key.toLowerCase();
    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "keep-alive" ||
      lower === "transfer-encoding" ||
      lower === "te" ||
      lower === "trailer" ||
      lower === "upgrade" ||
      lower === "content-length"
    ) {
      return;
    }
    headers[key] = value;
  });

  // Log the Cookie header being forwarded for debugging HttpOnly cookie auth
  if (headers["cookie"]) {
    console.log(`[API Proxy] Forwarding Cookie header: ${headers["cookie"].substring(0, 120)}...`);
  }

  // Override host to match the backend
  try {
    const backendHost = new URL(BACKEND_URL).host;
    headers["host"] = backendHost;
  } catch {
    // ignore URL parse errors
  }

  try {
    // Read the request body (if any) as ArrayBuffer for safe forwarding
    let body: ArrayBuffer | string | undefined = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const arrayBuf = await req.arrayBuffer();
      body = arrayBuf.byteLength > 0 ? arrayBuf : undefined;
    }

    // Forward the request to the backend
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    // Build the response headers, skipping problematic headers
    // FIX: Use append() instead of set() for ALL response headers.
    // When the backend sends multiple Set-Cookie headers (e.g. accessToken
    // + refreshToken), set() OVERWRITES the previous value so only the last
    // cookie survives. append() preserves every header value, which is
    // critical for Set-Cookie but harmless for single-value headers.
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        lower === "connection" ||
        lower === "keep-alive" ||
        lower === "transfer-encoding" ||
        lower === "content-encoding" ||
        lower === "content-length"
      ) {
        return;
      }
      // Use append() to preserve multiple values for the same header name.
      // This is especially important for Set-Cookie where the backend may
      // return accessToken and refreshToken as separate headers.
      responseHeaders.append(key, value);
    });

    // Log Set-Cookie headers being forwarded for debugging
    const setCookieHeaders = responseHeaders.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      console.log(`[API Proxy] Forwarding ${setCookieHeaders.length} Set-Cookie header(s):`,
        setCookieHeaders.map((h: string) => h.substring(0, 80) + (h.length > 80 ? "..." : ""))
      );
    }

    // Return the backend response with the same status code
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    // Backend unreachable or network error
    const message =
      error instanceof Error ? error.message : "Unknown proxy error";
    console.error(
      `[API Proxy] Failed to proxy ${req.method} ${targetUrl}:`,
      message
    );

    return NextResponse.json(
      {
        error: "Backend unreachable",
        message: `Could not connect to backend at ${BACKEND_URL}. Is the Spring Boot server running?`,
        details: message,
      },
      { status: 502 }
    );
  }
}

// ─── HTTP method handlers ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req);
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  return proxyRequest(req);
}

export async function HEAD(req: NextRequest) {
  return proxyRequest(req);
}
