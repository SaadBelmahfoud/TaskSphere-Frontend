'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          TaskSphere Frontend &copy; {new Date().getFullYear()} — Sprint 1
        </div>
      </footer>
    </div>
  );
}
