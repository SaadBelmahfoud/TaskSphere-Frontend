"use client";

import Navbar from "./Navbar";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();

  if (!auth?.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          TaskSphere &copy; {new Date().getFullYear()} — Task Management Platform
        </div>
      </footer>
    </div>
  );
}
