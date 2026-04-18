'use client';

import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/LoginForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { auth, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && auth.isAuthenticated) {
      router.push('/tasks');
    }
  }, [auth.isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return null;
  }

  return <LoginForm />;
}
