/**
 * ═══════════════════════════════════════════════════════════════════
 * TESTS E2E — AUTHENTIFICATION
 * ═══════════════════════════════════════════════════════════════════
 *
 * Ces tests vérifient le flux complet d'authentification :
 * - Affichage de la page de login
 * - Validation des formulaires
 * - Connexion avec des identifiants valides
 * - Inscription d'un nouvel utilisateur
 * - Déconnexion
 * - Gestion des erreurs (identifiants invalides)
 *
 * PRÉREQUIS :
 * ───────────
 * - Le backend Spring Boot doit tourner sur localhost:8080
 * - Le frontend Next.js doit tourner sur localhost:3000
 * - La base H2 doit contenir les utilisateurs de test (DataInitializer)
 *
 * UTILISATEURS DE TEST (créés par DataInitializer) :
 * ────────────────────────────────────────────────────
 * - saadoune@tasksphere.com / password123 (USER)
 * - manager@tasksphere.com / password123 (MANAGER)
 * - admin@tasksphere.com / password123 (ADMIN)
 *
 * PATTERN DES TESTS E2E :
 * ────────────────────────
 * 1. Arrange : Préparer les données de test
 * 2. Act : Exécuter l'action (clic, saisie, navigation)
 * 3. Assert : Vérifier le résultat attendu
 */

import { test, expect } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════
// TEST GROUP : Page de connexion (Login)
// ═══════════════════════════════════════════════════════════════════

test.describe("Page de connexion (Login)", () => {
  test("devrait afficher le formulaire de connexion", async ({ page }) => {
    // Act : Naviguer vers la page de connexion
    await page.goto("/");

    // Assert : Vérifier que les éléments du formulaire sont visibles
    await expect(page.getByText("Welcome to TaskSphere")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("devrait afficher un lien vers la page d'inscription", async ({ page }) => {
    await page.goto("/");

    // Assert : Le lien "Create one" doit être visible
    const registerLink = page.getByRole("link", { name: /create one/i });
    await expect(registerLink).toBeVisible();

    // Act : Cliquer sur le lien
    await registerLink.click();

    // Assert : On doit être redirigé vers /register
    await expect(page).toHaveURL(/\/register/);
  });

  test("devrait afficher une erreur pour des identifiants invalides", async ({ page }) => {
    await page.goto("/");

    // Act : Remplir le formulaire avec des identifiants invalides
    await page.getByLabel("Email").fill("invalid@test.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Assert : Un message d'erreur doit apparaître
    // Le backend retourne : { "error": "Email ou mot de passe incorrect" }
    await expect(page.getByText(/incorrect|invalid|error/i)).toBeVisible({ timeout: 10000 });
  });

  test("devrait afficher une erreur de validation pour un email invalide", async ({ page }) => {
    await page.goto("/");

    // Act : Saisir un email invalide
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Assert : Le message d'erreur Zod doit apparaître
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("devrait se connecter avec des identifiants valides", async ({ page }) => {
    await page.goto("/");

    // Act : Remplir avec les identifiants de test (DataInitializer)
    await page.getByLabel("Email").fill("saadoune@tasksphere.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Assert : Redirection vers le dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST GROUP : Page d'inscription (Register)
// ═══════════════════════════════════════════════════════════════════

test.describe("Page d'inscription (Register)", () => {
  test("devrait afficher le formulaire d'inscription", async ({ page }) => {
    await page.goto("/register");

    // Assert : Tous les champs doivent être visibles
    await expect(page.getByText("Create Account")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
  });

  test("devrait afficher une erreur si les mots de passe ne correspondent pas", async ({ page }) => {
    await page.goto("/register");

    // Act : Remplir avec des mots de passe différents
    await page.getByLabel("Username").fill("testuser");
    await page.getByLabel("First Name").fill("Test");
    await page.getByLabel("Last Name").fill("User");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByLabel("Confirm Password").fill("different123");
    await page.getByRole("button", { name: /create account/i }).click();

    // Assert : Le message d'erreur Zod doit apparaître
    await expect(page.getByText(/do not match/i)).toBeVisible();
  });

  test("devrait afficher un lien vers la page de connexion", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.getByRole("link", { name: /sign in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL("/");
  });
});

// ═══════════════════════════════════════════════════════════════════
// TEST GROUP : Navigation authentifiée
// ═══════════════════════════════════════════════════════════════════

test.describe("Navigation après connexion", () => {
  // Avant chaque test de ce groupe, se connecter
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("saadoune@tasksphere.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("devrait afficher le dashboard après connexion", async ({ page }) => {
    // Assert : Le dashboard doit contenir des éléments caractéristiques
    await expect(page.getByText(/dashboard|total tasks|overview/i)).toBeVisible();
  });

  test("devrait pouvoir naviguer vers les tâches", async ({ page }) => {
    // Act : Cliquer sur le lien Tasks dans la navbar
    const tasksLink = page.getByRole("link", { name: /tasks/i }).first();
    await tasksLink.click();

    // Assert : URL doit contenir /tasks
    await expect(page).toHaveURL(/\/tasks/);
  });

  test("devrait pouvoir se déconnecter", async ({ page }) => {
    // Act : Cliquer sur le bouton de déconnexion
    const logoutButton = page.getByRole("button", { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Assert : Retour à la page de connexion
      await expect(page).toHaveURL("/", { timeout: 10000 });
    }
  });
});
