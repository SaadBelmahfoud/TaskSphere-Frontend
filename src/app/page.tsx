"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Loader2 } from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════════
 * PAGE DE CONNEXION — LoginPage
 * ═══════════════════════════════════════════════════════════════════
 *
 * FLUX COMPLET :
 * ──────────────
 * 1. L'utilisateur saisit email + mot de passe
 * 2. Validation côté client (Zod : email valide, password ≥ 6 chars)
 * 3. Appel POST /api/v1/auth/login { email, password }
 * 4. Succès → stockage JWT → redirection /dashboard
 * 5. Échec → affichage du message d'erreur du backend
 *
 * GESTION DES ERREURS :
 * ──────────────────────
 * Le backend retourne les erreurs au format : { "error": "message" }
 * - 401 : "Email ou mot de passe incorrect"
 * - 403 : "Compte désactivé"
 * - 400 : erreur de validation Jakarta
 *
 * RAPPEL : Le backend utilise Map<String, String> comme body de login.
 * Donc on envoie bien { "email": "...", "password": "..." }.
 * Le backend fait : loginRequest.get("email") et loginRequest.get("password").
 */
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    setErrors({});

    // ═══════════════════════════════════════════════════════
    // VALIDATION CÔTÉ CLIENT (Zod)
    // ═══════════════════════════════════════════════════════
    // Avant d'envoyer au serveur, on valide localement.
    // Cela évite des requêtes inutiles et donne un feedback instantané.
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form);
      router.push("/dashboard");
    } catch (err: unknown) {
      // ═══════════════════════════════════════════════════════
      // EXTRACTION DU MESSAGE D'ERREUR DU BACKEND
      // ═══════════════════════════════════════════════════════
      // Le backend Spring Boot retourne les erreurs dans différents formats :
      // - AuthController : { "error": "message" } (Map<String, String>)
      // - GlobalExceptionHandler : { "message": "..." } ou { "error": "..." }
      // - Jakarta Validation : { "message": "Validation failed", "errors": [...] }
      //
      // On essaie d'extraire le message de tous ces formats.
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Invalid email or password";
      setServerError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">TS</span>
          </div>
          <CardTitle className="text-2xl">Welcome to TaskSphere</CardTitle>
          <CardDescription>Sign in to manage your tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
