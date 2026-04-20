'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { auth, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      router.push('/');
    }
  }, [auth.isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="bg-card border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center gap-8">
                <Skeleton className="h-6 w-28" />
                <div className="hidden sm:flex gap-2">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-9 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <footer className="bg-card border-t py-4 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </footer>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-card border-t py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          TaskSphere Frontend &copy; {new Date().getFullYear()} — Sprint 2 • shadcn/ui • TanStack Query
        </div>
      </footer>
    </div>
  );
}
