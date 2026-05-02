"use client";

import Navbar from "./Navbar";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

/**
 * AppLayout — wraps authenticated pages with Navbar + Footer.
 *
 * FIX: Uses a `mounted` flag to defer auth-dependent rendering to
 * client-side only. This prevents hydration mismatch because:
 *   - Server always renders the "unauthenticated" branch (no layout)
 *   - Client waits for hydration, then checks auth from localStorage
 *   - Only after mount does it render the full layout with Navbar
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Schedule via microtask to satisfy react-hooks/set-state-in-effect rule
    queueMicrotask(() => setMounted(true));
  }, []);

  // During SSR and initial hydration, render children without layout
  // This ensures server HTML matches client HTML
  if (!mounted) {
    return <>{children}</>;
  }

  // After mount, check auth and render appropriate layout
  if (!auth?.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground text-[8px] font-bold">TS</span>
            </div>
            TaskSphere &copy; {new Date().getFullYear()}
          </span>
          <span className="hidden sm:inline">Task Management Platform</span>
        </div>
      </footer>
    </div>
  );
}
