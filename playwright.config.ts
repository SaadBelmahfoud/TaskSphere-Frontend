/**
 * ═══════════════════════════════════════════════════════════════════
 * CONFIGURATION PLAYWRIGHT — Tests End-to-End (E2E)
 * ═══════════════════════════════════════════════════════════════════
 *
 * PRINCIPE DES TESTS E2E :
 * ─────────────────────────
 * Les tests End-to-End simulent un utilisateur réel qui interagit
 * avec l'application dans un navigateur. Ils testent le flux complet :
 * - Navigation entre les pages
 * - Saisie dans les formulaires
 * - Clic sur les boutons
 * - Vérification des résultats affichés
 *
 * POURQUOI PLAYWRIGHT ET PAS CYPRESS ?
 * ──────────────────────────────────────
 * - Playwright est développé par Microsoft (même écosystème que Next.js)
 * - Plus rapide et plus stable que Cypress
 * - Support natif de Chrome, Firefox, Safari
 * - Meilleur support du mode headless (sans interface graphique)
 * - Auto-wait : attend automatiquement que les éléments soient prêts
 *
 * ARCHITECTURE DES TESTS :
 * ────────────────────────
 * ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 * │ Test Playwright│ ──→ │ Navigateur   │ ──→ │ Serveur      │
 * │ (Node.js)     │ ←── │ (Chromium)   │ ←── │ Next.js      │
 * └──────────────┘     └──────────────┘     └──────────────┘
 *
 * Le test démarre un navigateur, navigue vers l'application,
 * interagit avec les éléments, et vérifie les résultats.
 *
 * COMMANDES :
 * ───────────
 * npx playwright test          → Lancer tous les tests
 * npx playwright test --ui     → Lancer avec interface graphique
 * npx playwright test --debug  → Mode debug (pas à pas)
 * npx playwright show-report   → Voir le rapport HTML
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Dossier contenant les fichiers de test
  testDir: "./e2e",

  // Temps maximum pour un test (30 secondes)
  // Si un test dépasse ce temps → échec
  timeout: 30_000,

  // Temps maximum pour une assertion (ex: expect(el).toBeVisible())
  // Playwright attend que l'élément apparaisse pendant ce temps
  expect: {
    timeout: 5_000,
  },

  // Rapport HTML généré après les tests
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  // Configuration commune pour tous les projets
  use: {
    // URL de base de l'application
    // Les tests utilisent `await page.goto("/")` au lieu de l'URL complète
    baseURL: "http://localhost:3000",

    // Capture d'écran en cas d'échec (pour le débogage)
    screenshot: "only-on-failure",

    // Trace pour le débogage avancé (actions + DOM + réseau)
    trace: "on-first-retry",
  },

  // Navigateurs à tester
  // Chromium = Chrome, Firefox = Firefox, WebKit = Safari
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Décommentez pour tester sur plus de navigateurs :
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // Démarrer le serveur avant les tests
  // Playwright attend que le serveur soit prêt avant de lancer les tests
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true, // Réutiliser un serveur déjà démarré
    timeout: 60_000,
  },
});
