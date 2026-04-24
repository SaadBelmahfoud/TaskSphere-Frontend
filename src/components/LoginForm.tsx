'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, LoginFormData } from '@/lib/schemas';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch {
      // Error is handled by the context + toast
    }
  };

  const quickLogins = [
    { label: 'USER', email: 'saadoune@tasksphere.com', variant: 'outline' as const },
    { label: 'MANAGER', email: 'manager@tasksphere.com', variant: 'outline' as const },
    { label: 'ADMIN', email: 'admin@tasksphere.com', variant: 'outline' as const },
  ];

  const handleQuickLogin = (email: string) => {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (emailInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(emailInput, email);
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (passwordInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeInputValueSetter?.call(passwordInput, 'password123');
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">TaskSphere</h1>
          <p className="text-muted-foreground">Sign in to access your tasks</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', {
                    onChange: () => clearError(),
                  })}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', {
                    onChange: () => clearError(),
                  })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                  Register
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Quick access (password: password123)
              </p>
              <div className="flex gap-2">
                {quickLogins.map((quick) => (
                  <Button
                    key={quick.label}
                    variant={quick.variant}
                    size="sm"
                    onClick={() => handleQuickLogin(quick.email)}
                    className="flex-1"
                  >
                    {quick.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          TaskSphere — Sprint 3 &bull; JWT Auth + CRUD + Ownership
        </p>
      </div>
    </div>
  );
}
