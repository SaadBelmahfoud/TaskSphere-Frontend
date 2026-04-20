'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock } from 'lucide-react';

export default function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // Error is handled by the context + toast
    }
  };

  const quickLogins = [
    { label: 'USER', email: 'saadoune@tasksphere.com', variant: 'outline' as const },
    { label: 'MANAGER', email: 'manager@tasksphere.com', variant: 'outline' as const },
    { label: 'ADMIN', email: 'admin@tasksphere.com', variant: 'outline' as const },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">TaskSphere</h1>
          <p className="text-muted-foreground">Connectez-vous pour accéder à vos tâches</p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  required
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connexion...</>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Accès rapide (mot de passe : password123)
              </p>
              <div className="flex gap-2">
                {quickLogins.map((quick) => (
                  <Button
                    key={quick.label}
                    variant={quick.variant}
                    size="sm"
                    onClick={() => { setEmail(quick.email); setPassword('password123'); }}
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
          TaskSphere Frontend — Sprint 2 • JWT Auth + CRUD + Ownership
        </p>
      </div>
    </div>
  );
}
