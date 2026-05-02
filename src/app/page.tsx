/**
 * ═══════════════════════════════════════════════════════════════════
 * LOGIN PAGE — React Hook Form + Zod Validation
 * ═══════════════════════════════════════════════════════════════════
 *
 * PHASE 2 — TÂCHE 3 : Refactor avec React Hook Form
 * ──────────────────────────────────────────────────────
 *
 * PROBLÈME AVANT :
 *   Le formulaire utilisait un useState pour chaque champ + validation
 *   manuelle avec safeParse. Cela impliquait :
 *   - 3 useState (form, errors, serverError) + 1 loading
 *   - Validation manuelle : safeParse → extraction des fieldErrors
 *   - Gestion manuelle du onChange pour chaque champ
 *   - Pas de validation en temps réel (uniquement au submit)
 *
 *   PRINCIPE VIOLÉ : Consistency
 *   TaskForm.tsx utilise déjà react-hook-form + zodResolver.
 *   Login/Register devraient utiliser la MÊME approche.
 *
 * SOLUTION APRÈS :
 *   react-hook-form gère TOUT automatiquement :
 *   - Register : connecte les inputs au form state
 *   - zodResolver : validation Zod → erreurs react-hook-form
 *   - handleSubmit : empêche le submit si erreurs
 *   - formState.errors : erreurs par champ (affichage conditionnel)
 *   - formState.isSubmitting : état de soumission
 *
 *   AVANTAGES :
 *   1. MOINS DE CODE : ~15 lignes en moins par formulaire
 *   2. CONSISTANCE : même pattern que TaskForm.tsx
 *   3. UX MEILLEURE : validation en temps réel au blur
 *   4. MAINTENABILITÉ : un seul schéma Zod = source de vérité
 */
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Loader2, ListTodo, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");
    try {
      await login(data);
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-coral/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-sky/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/25 rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-primary-foreground font-bold text-2xl">TS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to TaskSphere
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Sign in to manage your tasks
          </p>
        </div>

        <Card className="shadow-xl border-primary/10">
          <CardContent className="pt-6">
            {serverError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  disabled={isSubmitting}
                  className="transition-colors focus-visible:ring-primary/30"
                  autoFocus
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isSubmitting}
                  className="transition-colors focus-visible:ring-primary/30"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75 shadow-md shadow-primary/20 transition-all duration-200" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
