# TaskSphere-Frontend

Frontend Next.js 14 pour le projet TaskSphere-Platform (Sprint 2).

## Prérequis

- **Node.js** >= 18
- **npm** ou **bun** comme gestionnaire de paquets
- **Backend TaskSphere-Platform** démarré sur `localhost:8080`
  - Branche `develop` avec CORS configuré

## Installation

```bash
cd TaskSphere-Frontend
npm install
```

## Démarrage

```bash
npm run dev
```

L'application est accessible sur **http://localhost:3000**.

---

## Architecture

```
src/
├── app/
│   ├── globals.css          # CSS variables shadcn/ui + scrollbar custom
│   ├── layout.tsx           # Root layout : QueryProvider + AuthProvider + Toaster
│   ├── page.tsx             # Page de connexion (login) avec Skeleton loading
│   ├── tasks/
│   │   ├── page.tsx         # Liste des tâches (TanStack Query + Skeleton)
│   │   └── [id]/
│   │       └── page.tsx     # Détail/édition d'une tâche (TanStack Query)
│   └── ownership/
│       └── page.tsx         # Page de test d'ownership
├── components/
│   ├── ui/                  # Composants shadcn/ui (Button, Card, Input, etc.)
│   │   ├── button.tsx       # Bouton avec variants (cva)
│   │   ├── card.tsx         # Conteneur Card (Header, Content, Footer)
│   │   ├── input.tsx        # Input text avec focus ring
│   │   ├── label.tsx        # Label (Radix UI)
│   │   ├── textarea.tsx     # Textarea multi-lignes
│   │   ├── dialog.tsx       # Dialog modal (Radix UI)
│   │   ├── badge.tsx        # Badge/tag avec variants
│   │   ├── skeleton.tsx     # Skeleton loading placeholder
│   │   └── sonner.tsx       # Toaster wrapper (Sonner)
│   ├── AppLayout.tsx        # Layout protégé (Navbar + Footer + Skeleton)
│   ├── Navbar.tsx           # Barre de navigation (React.memo + Lucide)
│   ├── LoginForm.tsx        # Formulaire de connexion (shadcn Card/Input)
│   ├── TaskCard.tsx         # Carte de tâche (shadcn Card/Badge + memo)
│   ├── TaskForm.tsx         # Formulaire création/édition (shadcn Input/Textarea)
│   ├── ConfirmDialog.tsx    # Dialogue de confirmation (shadcn Dialog)
│   └── TokenTimer.tsx       # Compteur token (Badge + React.memo)
├── context/
│   └── AuthContext.tsx       # Auth state + login/logout + auto-refresh + toast
├── hooks/
│   └── useTasks.ts          # TanStack Query hooks (queries + mutations)
├── lib/
│   ├── api.ts               # Client Axios + intercepteurs JWT + queue refresh
│   └── utils.ts             # Utilitaire cn() (clsx + tailwind-merge)
├── providers/
│   └── QueryProvider.tsx    # TanStack QueryClient provider
└── types/
    └── index.ts             # Types TypeScript + isApiError type guard
```

---

## Fonctionnalités

- **Authentification JWT** avec auto-refresh transparent (queue de requêtes)
- **CRUD complet** des tâches (créer, lister, voir, modifier, supprimer)
- **Gestion des statuts** (TODO → DOING → DONE)
- **Priorités** (LOW, MEDIUM, HIGH, CRITICAL)
- **Pagination** côté serveur
- **Ownership** : chaque utilisateur ne voit que ses tâches
- **Page de test d'ownership** automatisée
- **Token timer** visible dans la navbar
- **Soft delete** (archivage)
- **shadcn/ui** pour un design system cohérent
- **TanStack Query v5** pour le cache automatique
- **Sonner Toast** pour les notifications

## Utilisateurs de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| saadoune@tasksphere.com | password123 | USER |
| manager@tasksphere.com | password123 | MANAGER |
| admin@tasksphere.com | password123 | ADMIN |

---

## Explications Théoriques

### 1. shadcn/ui — Design System

shadcn/ui n'est pas une librairie npm classique mais un **générateur de composants** basé sur Radix UI + Tailwind CSS. Chaque composant est copié dans le projet (`src/components/ui/`), ce qui permet une personnalisation totale.

**Principes clés :**
- **Radix UI** fournit l'accessibilité (aria, focus trap, keyboard navigation) et le comportement (Dialog, Label, etc.)
- **Tailwind CSS** fournit le style via des classes utilitaires
- **cva (class-variance-authority)** gère les variants de composants (Button a 6 variants × 4 tailles = 24 combinaisons)
- **cn()** (clsx + tailwind-merge) fusionne les classes en évitant les conflits

**Schéma du composant Button :**
Ce schéma décrit comment `class-variance-authority` génère automatiquement toutes les combinaisons de styles pour le composant Button. Les variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) définissent l'apparence visuelle, tandis que les sizes (`default`, `sm`, `lg`, `icon`) définissent les dimensions. Le composant final combine un variant + une size + des classes personnalisées via `cn()`.
```
Button Variants (cva)
┌──────────┬────────────┬──────────┬──────────┬──────────┬──────────┐
│ default  │ destructive│ outline  │ secondary│  ghost   │   link   │
│ bg-primary│bg-destruct│border    │bg-second.│hover bg- │text-prim.│
│ text-pri.│text-dest.  │hover bg- │text-seco.│accent    │underline │
│          │            │accent    │          │          │offset-4  │
└──────────┴────────────┴──────────┴──────────┴──────────┴──────────┘
Sizes:  default (h-10 px-4) | sm (h-9 px-3) | lg (h-11 px-8) | icon (h-10 w-10)
```

**Schéma des CSS Variables du thème :**
Ce schéma illustre comment les variables CSS HSL (`--primary`, `--background`, etc.) permettent de thémiser uniformément tous les composants. Chaque composant shadcn/ui référence ces variables (ex: `bg-primary` → `hsl(var(--primary))`). Pour changer la couleur primaire de l'application, il suffit de modifier la valeur de `--primary` dans `globals.css`.
```
:root (CSS Variables HSL)
├── --primary: 160 84% 39%        ← Emerald (couleur principale)
├── --primary-foreground: 0 0% 98%
├── --background: 0 0% 100%       ← Blanc
├── --foreground: 240 10% 3.9%    ← Noir
├── --muted: 240 4.8% 95.9%       ← Gris clair
├── --destructive: 0 84.2% 60.2%  ← Rouge
├── --border: 240 5.9% 90%        ← Bordure
├── --input: 240 5.9% 90%         ← Input border
└── --ring: 160 84% 39%           ← Focus ring (emerald)
```

### 2. TanStack Query v5 — Cache Serveur

TanStack Query (React Query) est un gestionnaire de **cache serveur** qui simplifie la récupération, le cache, la synchronisation et la mise à jour des données d'une API.

**Pourquoi l'utiliser ?**
- **Cache automatique** : pas de `useState` + `useEffect` + `fetch` manuel
- **Stale time** : les données sont "fraîches" pendant 30s, pas de re-fetch inutile
- **Invalidation** : après une mutation (create/update/delete), le cache est invalidé automatiquement
- **Gestion d'erreur** : `isError`, `error` gérés nativement
- **Retry** : tentatives automatiques en cas d'erreur réseau

**Schéma Query Keys Factory :**
Ce schéma montre comment les clés de cache sont structurées en arbre hiérarchique. Chaque niveau de précision permet d'invalider sélectivement une partie du cache. Par exemple, `invalidateQueries({ queryKey: ['tasks', 'list'] })` invalide toutes les pages de la liste sans toucher au détail d'une tâche spécifique.
```
taskKeys (Query Keys Factory)
├── all:           ['tasks']
├── lists():       ['tasks', 'list']
│   ├── list(0):   ['tasks', 'list', { page: 0, size: 20 }]
│   └── list(1):   ['tasks', 'list', { page: 1, size: 20 }]
└── details():     ['tasks', 'detail']
    └── detail(id): ['tasks', 'detail', 'abc-123']
```

**Schéma du flux de données avec cache :**
Ce schéma illustre le cycle de vie d'une donnée dans TanStack Query. Lorsqu'un composant appelle `useQuery`, le QueryClient vérifie d'abord le cache : si les données sont fraîches (staleTime < 30s), elles sont retournées immédiatement sans requête réseau. Si elles sont périmées, une requête en arrière-plan est lancée (stale-while-revalidate). Les mutations (`useMutation`) déclenchent une invalidation du cache, ce qui provoque un re-fetch automatique des données impactées.
```
Composant → useQuery(key) → QueryClient → Cache ?
                                         ├── HIT  → retourne data (pas de fetch)
                                         └── MISS → fetch API → stocke en cache → retourne data

Mutation → useMutation → API → onSuccess → invalidateQueries(key) → re-fetch
```

### 3. Sonner Toast — Système de Notification

Sonner est une librairie de toasts élégants avec animations. Elle est intégrée via le composant `<Toaster />` dans le layout racine.

**Types de toast :**
- `toast.success('message')` → toast vert
- `toast.error('message')` → toast rouge
- `toast.info('message')` → toast bleu
- `toast('message')` → toast neutre

**Où les toasts sont utilisés :**
- Login réussi → `toast.success('Bienvenue !')`
- Login échoué → `toast.error('Échec de la connexion')`
- Logout → `toast.info('Déconnecté')`
- Création de tâche → `toast.success('Tâche créée')` (dans le hook useCreateTask)
- Mise à jour → `toast.success('Tâche mise à jour')` (dans le hook useUpdateTask)
- Suppression → `toast.success('Tâche supprimée')` (dans le hook useDeleteTask)
- Erreurs API → `toast.error('Erreur...')` (dans chaque mutation hook)

**Schéma d'intégration du Toaster :**
Ce schéma montre que le composant `<Toaster>` est placé dans le layout racine, au même niveau que les providers. Les toasts sont déclenchés depuis n'importe quel composant via `import { toast } from 'sonner'` car Sonner utilise un store interne (pas besoin de contexte React).
```
layout.tsx
├── <QueryProvider>
│   ├── <AuthProvider>
│   │   └── {children}     ← Pages utilisent toast.success() / toast.error()
│   ├── <Toaster />        ← Affiche les toasts (bottom-right)
```

### 4. Corrections B1-B12

#### B1/B2 — Type Guard `isApiError` (typage sécurisé)
**Avant :** Les erreurs Axios étaient castées de manière unsafe avec `as` :
```typescript
const err = error as { response?: { data?: { message?: string } } };
```
**Problème :** Pas de vérification à l'exécution → crash si la structure est différente.

**Après :** On utilise un type guard `isApiError()` qui vérifie la structure à l'exécution :
```typescript
if (isApiError(error)) {
  const message = error.response.data.message; // type-safe ✓
}
```
Un **type guard** est une fonction TypeScript qui retourne un `boolean` et agit comme une **assertion de type** dans un bloc `if`. TypeScript comprend que dans le bloc `if`, l'objet a la forme déclarée.

**Schéma du type guard :**
Ce schéma décrit le fonctionnement d'un type guard TypeScript. La fonction `isApiError` vérifie à l'exécution que l'objet `error` possède la structure attendue (`response.data.error/message/status`). Si elle retourne `true`, TypeScript rétrécit (narrows) le type de `error` vers la forme typée, permettant un accès sécurisé aux propriétés sans cast.
```
isApiError(error: unknown): error is { response: { data: ApiErrorResponse; status: number } }
├── typeof error === 'object'     → vérifie que c'est un objet
├── error !== null                → vérifie que ce n'est pas null
├── 'response' in error           → vérifie que response existe
├── typeof response === 'object'  → vérifie que response est un objet
└── 'data' in response            → vérifie que data existe

Si TRUE → TypeScript narrows le type vers la forme ApiErrorResponse
Si FALSE → error reste unknown
```

#### B3/B9 — Skeleton Loading (élimination du flash blanc)
**Avant :** Un spinner était affiché pendant le chargement, puis remplacé brutalement par le contenu → **flash blanc**.
**Après :** Des composants `Skeleton` (rectangles gris pulsants) simulent la structure du contenu final. La transition entre le Skeleton et le contenu réel est fluide car les formes correspondent.

**Schéma du Skeleton Loading :**
Ce schéma compare les deux approches de chargement. Avec le spinner, l'utilisateur voit un espace vide puis un contenu qui apparaît brutalement (flash blanc). Avec le Skeleton, l'utilisateur voit immédiatement la structure de la page sous forme de rectangles gris animés, puis les données remplacent progressivement les squelettes — l'expérience est perçue comme plus rapide et plus fluide.
```
AVANT (Spinner) :
┌──────────────────┐     ┌──────────────────┐
│     ⏳ spinner    │ ──→ │   Contenu réel    │  ← Flash blanc !
│     (vide)       │     │   (apparaît)      │
└──────────────────┘     └──────────────────┘

APRÈS (Skeleton) :
┌──────────────────┐     ┌──────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │     │  Titre de tâche  │
│  ▓▓▓▓▓▓▓▓▓       │ ──→ │  Description...  │  ← Transition fluide
│  ▓▓▓▓▓▓▓▓▓▓▓     │     │  Status badges   │
│  ▓▓▓▓▓▓          │     │  Actions         │
└──────────────────┘     └──────────────────┘
```

#### B8 — React.memo sur Navbar et TokenTimer (réduction des re-rendus)
**Problème :** Le Navbar et le TokenTimer se re-rendaient à chaque changement de state dans les pages parentes (tasks, task detail), même si leurs props n'avaient pas changé.
**Solution :** `React.memo` empêche le re-rendu si les props sont identiques.

**Schéma React.memo :**
Ce schéma illustre le comportement de `React.memo` : avant son application, chaque changement de state dans un composant parent provoquait un re-rendu inutile du Navbar (même si ses props `auth`, `logout`, `router`, `pathname` n'avaient pas changé). Avec `React.memo`, React compare les props avant de décider de re-rendre — si elles sont identiques, le composant est ignoré.
```
Page (state change: tasks loading...)
│
├── AVANT (sans memo) : Navbar se re-rend ❌
│   └── DOM mis à jour pour rien → perte de performance
│
└── APRÈS (avec memo) : Navbar ne se re-rend pas ✅
    └── React.compare(props) → identiques → skip render
```

#### B4 — Race Conditions (corrigées par TanStack Query)
**Problème :** Plusieurs requêtes concurrentes (ex: clic rapide sur pagination) pouvaient aboutir à des incohérences dans l'affichage.
**Solution :** TanStack Query gère nativement les requêtes concurrentes. Si une nouvelle requête est lancée alors que la précédente est en cours, seule la dernière réponse est prise en compte.

### 5. Architecture Axios — Interceptors JWT + Auto-Refresh

Le client Axios (`src/lib/api.ts`) est configuré avec deux interceptors :

1. **Request Interceptor** : injecte automatiquement le header `Authorization: Bearer <token>` dans chaque requête.
2. **Response Interceptor** : si une réponse est `401 Unauthorized`, tente un refresh automatique du token via `POST /auth/refresh`.

**Schéma de l'auto-refresh avec queue :**
Ce schéma décrit le mécanisme de file d'attente (queue) utilisé pour gérer les requêtes concurrentes pendant un refresh de token. Quand la première requête reçoit un 401, elle déclenche le refresh. Les requêtes suivantes qui reçoivent aussi un 401 pendant ce refresh sont mises en attente dans une queue. Une fois le refresh terminé, toutes les requêtes en attente sont rejouées avec le nouveau token.
```
Requête 1 → 401
┌─────────────────────────────────┐
│  isRefreshing = true             │
│  refreshCallback() → nouveau JWT │
│                                  │
│  PENDANT le refresh :            │
│  Requête 2 → 401 → queue.push() │
│  Requête 3 → 401 → queue.push() │
│                                  │
│  APRÈS le refresh :              │
│  processQueue() → rejoue 2 et 3  │
│  avec le nouveau token           │
│  isRefreshing = false            │
└─────────────────────────────────┘
```

### 6. Architecture AuthContext — Authentification JWT

Le `AuthProvider` gère l'état d'authentification avec :

- **Chargement initial** : restauration depuis `localStorage` au démarrage
- **Login** : appel API + décodage JWT + sauvegarde state + toast
- **Logout** : appel API + nettoyage state + toast + redirection
- **Refresh** : callback injecté dans l'intercepteur Axios
- **Persistance** : state sauvegardé dans `localStorage('tasksphere_auth')`

**Schéma d'architecture du contexte d'authentification :**
Ce schéma montre le cycle de vie complet de l'authentification. Le AuthProvider maintient un state `AuthState` (token, email, rôle, etc.) qui est persisté dans localStorage. Au login, le JWT est décodé côté client pour extraire l'email et le rôle. Les intercepteurs Axios utilisent des callbacks injectés par le AuthProvider pour le refresh automatique du token.
```
AuthProvider
├── State: AuthState
│   ├── accessToken: string | null
│   ├── refreshToken: string | null
│   ├── email, role, isAuthenticated, tokenExpiry
│
├── useEffect (mount): Chargement initial depuis localStorage
├── useEffect (mount): Configuration callbacks Axios interceptors
│
├── login(email, password)
│   ├── POST /api/v1/auth/login
│   ├── JWT decode → extraire email + role
│   ├── updateAuth(newState)
│   └── toast.success() + router.push('/tasks')
│
├── logout()
│   ├── POST /api/v1/auth/logout
│   ├── updateAuth(defaultAuth)
│   └── toast.info() + router.push('/')
│
└── Persistance: localStorage('tasksphere_auth') ↔ State
    Sync: Axios interceptors (auto-refresh)
```

---

## API Proxy

Le fichier `next.config.js` configure un proxy qui redirige les requêtes `/api/*` vers `localhost:8080`. Le CORS doit être configuré côté backend.

```javascript
rewrites: [
  { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }
]
```

## Git Workflow (industriel)

```bash
# Branch develop (branche principale)
git checkout develop
git pull origin develop

# Feature branch pour chaque fonctionnalité
git checkout -b feature/shadcn-ui-integration
git checkout -b feature/tanstack-query-cache
git checkout -b fix/b1-type-guards

# Commit avec Conventional Commits
git add .
git commit -m "feat(frontend): ajouter shadcn/ui design system"
git commit -m "fix(frontend): corriger B1-B2 type guards isApiError"
git commit -m "feat(frontend): integrer TanStack Query pour le cache"
git commit -m "fix(frontend): corriger B3-B9 flash blanc avec Skeleton"
git commit -m "fix(frontend): corriger B8 re-rendus avec React.memo"
git commit -m "feat(frontend): ajouter Sonner toast system"

# Push + Pull Request vers develop
git push origin feature/shadcn-ui-integration
# → Créer une PR sur GitHub : feature → develop
```

## Technologies

| Technologie | Version | Rôle |
|-------------|---------|------|
| Next.js | 14 (App Router) | Framework React avec SSR/SSG |
| TypeScript | 5.7 | Typage statique |
| Tailwind CSS | 3.4 | Framework CSS utilitaire |
| shadcn/ui | latest | Design system (Radix + Tailwind) |
| TanStack Query | 5.x | Cache serveur + mutations |
| Sonner | 1.x | Système de toast |
| Axios | 1.7 | Client HTTP + interceptors |
| Lucide React | latest | Icônes SVG |
| clsx + tailwind-merge | latest | Fusion de classes CSS |
| class-variance-authority | 0.7 | Variants de composants |
| Radix UI | latest | Accessibilité (Dialog, Label) |
