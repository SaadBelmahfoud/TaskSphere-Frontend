"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, RotateCcw, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaskTimerProps {
  taskId: string;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const STORAGE_KEY_PREFIX = "tasksphere_timer_";

function loadStoredTotal(key: string): number {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {
    // localStorage unavailable, ignore
  }
  return 0;
}

export default function TaskTimer({ taskId }: TaskTimerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${taskId}`;

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(() => loadStoredTotal(storageKey));
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save total time to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, totalSeconds.toString());
    } catch {
      // localStorage unavailable, ignore
    }
  }, [totalSeconds, storageKey]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(true);
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Save current session to total
    setTotalSeconds((prev) => prev + sessionSeconds);
    setSessionSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
  }, [sessionSeconds]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSessionSeconds(0);
    setTotalSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // localStorage unavailable, ignore
    }
  }, [storageKey]);

  return (
    <Card className={`transition-all duration-300 ${isRunning ? "ring-2 ring-emerald-500/30" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Timer className="h-4 w-4" />
          Time Tracker
          {isRunning && (
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer display */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Session
          </div>
          <div className="font-mono text-3xl font-bold tabular-nums tracking-wider">
            {formatTime(sessionSeconds)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Total: <span className="font-mono font-medium">{formatTime(totalSeconds)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-2">
          {isRunning ? (
            <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Button
                onClick={pauseTimer}
                size="icon"
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
              >
                <Pause className="h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Button
                onClick={startTimer}
                size="icon"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
              >
                <Play className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button
              onClick={stopTimer}
              variant="outline"
              size="icon"
              disabled={!isRunning && !isPaused && sessionSeconds === 0}
            >
              <Square className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Button
              onClick={resetTimer}
              variant="ghost"
              size="icon"
              disabled={isRunning || (sessionSeconds === 0 && totalSeconds === 0)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
