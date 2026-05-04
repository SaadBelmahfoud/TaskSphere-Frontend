// Health check endpoint — confirms the Next.js frontend is running.
// All /api/v1/* requests are handled by the catch-all proxy at:
//   src/app/api/v1/[...path]/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "TaskSphere Frontend",
    backend: process.env.BACKEND_URL || "http://localhost:8080",
  });
}
