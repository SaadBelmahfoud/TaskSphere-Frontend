"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function TokenTimer() {
  const { auth } = useAuth();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!auth?.tokenExpiry) return;

    const interval = setInterval(() => {
      const remaining = auth.tokenExpiry - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [auth?.tokenExpiry]);

  if (!auth?.isAuthenticated) return null;

  const isLow = timeLeft !== "" && timeLeft !== "Expired" && parseInt(timeLeft.split(":")[0]) < 5;

  return (
    <span
      className={`text-xs font-mono px-2 py-1 rounded-md ${
        isLow
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"
      }`}
    >
      ⏱ {timeLeft || "..."}
    </span>
  );
}
