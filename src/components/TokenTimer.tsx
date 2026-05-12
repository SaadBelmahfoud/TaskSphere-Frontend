"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function TokenTimer() {
  const { auth, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (!auth?.tokenExpiry) return;

    const interval = setInterval(() => {
      const remaining = auth.tokenExpiry - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        // Auto-logout when token expires
        if (!hasLoggedOut.current) {
          hasLoggedOut.current = true;
          logout();
        }
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [auth?.tokenExpiry, logout]);

  if (!auth?.isAuthenticated) return null;

  const isExpired = timeLeft === "Expired";
  const isLow = !isExpired && timeLeft !== "" && parseInt(timeLeft.split(":")[0]) < 5;

  return (
    <span
      className={cn(
        "text-xs font-mono px-2 py-1 rounded-md transition-colors",
        isExpired
          ? "bg-destructive/10 text-destructive"
          : isLow
            ? "bg-amber/10 text-amber animate-pulse"
            : "bg-muted text-muted-foreground"
      )}
    >
      ⏱ {timeLeft || "..."}
    </span>
  );
}
