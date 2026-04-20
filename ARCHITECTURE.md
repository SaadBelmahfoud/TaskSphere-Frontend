# TaskSphere — Documentation d'Architecture Complète

> **Version :** 1.1.0 (Sprint 2)
> **Dernière mise à jour :** 2025
> **Auteur :** Équipe TaskSphere

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture Backend (Spring Boot)](#2-architecture-backend-spring-boot)
3. [Architecture Frontend (Next.js)](#3-architecture-frontend-nextjs)
4. [Connexion Frontend ↔ Backend](#4-connexion-frontend--backend)
5. [Intégration shadcn/ui](#5-intégration-shadcnui)
6. [TanStack Query](#6-tanstack-query)
7. [Système Toast (Sonner)](#7-système-toast-sonner)
8. [Corrections B1–B12](#8-corrections-b1b12)
9. [Sécurité](#9-sécurité)
10. [Guide de démarrage](#10-guide-de-démarrage)

---

## 1. Vue d'ensemble

### 1.1 Description du projet

TaskSphere est une application de gestion de tâches (task manager) professionnelle, construite avec une architecture frontend/backend séparée. Le backend est développé en Java avec Spring Boot et suit une architecture hexagonale multi-module. Le frontend est développé avec Next.js 14 (App Router) en TypeScript et utilise une stack moderne composée de shadcn/ui pour le design système, TanStack Query v5 pour la gestion du cache serveur, et Sonner pour les notifications toast.

L'application implémente un système d'authentification JWT complet avec refresh automatique de token, un contrôle d'accès basé sur l'ownership (chaque utilisateur ne peut accéder qu'à ses propres tâches), et des trois rôles : USER, MANAGER et ADMIN.

### 1.2 Stack technique

```
┌──────────────────────────────────────────────────────────────────┐
│                     STACK TECHNIQUE TASKSPHERE                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ BACKEND ──────────────────────────────────────────────────┐  │
│  │  • Java 17+        • Spring Boot 3.x                      │  │
│  │  • Spring Security  • JWT (JJWT)                          │  │
│  │  • Hibernate/JPA    • H2 Database (dev)                   │  │
│  │  • Architecture Hexagonale (IAM + Core)                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                      HTTP REST / JSON                            │
│                           │                                      │
│  ┌─ FRONTEND ─────────────────────────────────────────────────┐  │
│  │  • Next.js 14 App Router   • TypeScript 5.7               │  │
│  │  • React 18.3              • Tailwind CSS 3.4             │  │
│  │  • shadcn/ui (New York)    • Radix UI primitives          │  │
│  │  • TanStack Query v5       • Sonner (toast)               │  │
│  │  • Axios (interceptors)    • Lucide React (icônes)        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Type d'architecture

Le projet suit une architecture **SPA (Single Page Application)** avec rendu côté client (CSR). Chaque page est marquée `'use client'` car l'application nécessite un accès au contexte d'authentification, aux hooks de données TanStack Query, et à l'état local interactif. Le layout racine (`layout.tsx`) est un Server Component qui enveloppe toute l'application dans les providers nécessaires.

---

## 2. Architecture Backend (Spring Boot)

### 2.1 Structure multi-module

Le backend Spring Boot est organisé en deux modules principaux, suivant le principe de séparation des responsabilités :

```
┌──────────────────────────────────────────────────────────────────┐
│                  ARCHITECTURE MULTI-MODULE                       │
│                                                                  │
│  ┌─── tasksphere-iam ────────────────────────────────────────┐   │
│  │  Module Identity & Access Management                      │   │
│  │                                                           │   │
│  │  • Entités : User, Role, VerificationToken               │   │
│  │  • Auth : JWT generation, validation, refresh             │   │
│  │  • Controllers : AuthController                           │   │
│  │  • Repositories : UserRepository                          │   │
│  │  • Services : AuthenticationService                       │   │
│  │                                                           │   │
│  │  Rôles gérés :                                           │   │
│  │    ┌─────────┐  ┌──────────┐  ┌──────────┐                │   │
│  │    │  USER   │  │ MANAGER  │  │  ADMIN   │                │   │
│  │    └─────────┘  └──────────┘  └──────────┘                │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─── tasksphere-core ───────────────────────────────────────┐   │
│  │  Module Métier (Task Management)                          │   │
│  │                                                           │   │
│  │  • Entités : Task (title, description, status, priority, │   │
│  │              dueDate, completedAt, userId)                 │   │
│  │  • Controllers : TaskController                           │   │
│  │  • Services : TaskService                                 │   │
│  │  • Repositories : TaskRepository                          │   │
│  │  • Ownership check : userId du JWT == task.userId         │   │
│  │                                                           │   │
│  │  Statuts : TODO ──► DOING ──► DONE                       │   │
│  │  Priorités : LOW | MEDIUM | HIGH | CRITICAL               │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture hexagonale

Le backend suit le pattern d'architecture hexagonale (Ports & Adapters). Ce pattern sépare la logique métier (le domaine) des infrastructures externes (base de données, contrôleurs web, sécurité). Voici comment les couches s'organisent à l'intérieur de chaque module :

```
┌──────────────────────────────────────────────────────────────────┐
│               ARCHITECTURE HEXAGONALE (PAR MODULE)               │
│                                                                  │
│                    ┌──────────────────┐                          │
│                    │    DOMAIN         │                          │
│                    │  (Entités +       │                          │
│                    │   Use Cases)      │                          │
│                    └────────┬─────────┘                          │
│                             │                                    │
│              ┌──────────────┼──────────────┐                     │
│              │              │              │                     │
│     ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼────────┐           │
│     │  INBOUND      │ │ OUTBOUND │ │  CONFIG        │           │
│     │  (Adapters    │ │ (Ports   │ │  (Security,    │           │
│     │   Entrants)   │ │  Sortants│ │   CORS, etc.)  │           │
│     ├───────────────┤ ├──────────┤ ├───────────────┤           │
│     │ REST Control- │ │ Reposit- │ │ JWT Filter     │           │
│     │ lers (API)    │ │ ories    │ │ @PreAuthorize  │           │
│     │ DTO Mappers   │ │ JPA/H2   │ │ GlobalHandler  │           │
│     └───────────────┘ └──────────┘ └───────────────┘           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Explication des couches :**

- **Domaine (centre)** : Contient les entités métier (`User`, `Task`), les énumérations (`TaskStatus`, `TaskPriority`, `Role`) et la logique de validation. Cette couche n'a aucune dépendance vers l'extérieur — elle est purement Java.

- **Inbound / Adapters Entrants** : Les contrôleurs REST (`AuthController`, `TaskController`) transforment les requêtes HTTP en appels de service. Les DTOs (Data Transfer Objects) assurent la séparation entre le modèle de données exposé à l'API et le modèle interne.

- **Outbound / Ports Sortants** : Les repositories Spring Data JPA (`UserRepository`, `TaskRepository`) implémentent la persistance en base de données H2. Le domaine définit des interfaces de port, et les repositories sont les adaptateurs qui les implémentent.

- **Configuration** : La couche de configuration gère la sécurité Spring Security (filtres JWT), les règles CORS, la gestion globale des exceptions (`GlobalExceptionHandler`), et la configuration de la base de données.

### 2.3 Table des endpoints API

Le backend expose les endpoints REST suivants, accessibles via le proxy Next.js :

```
┌──────────────────────────────────────────────────────────────────┐
│                    ENDPOINTS API REST                             │
├────────────┬────────┬────────────────────────────────────────────┤
│ Module     │ Méthode│ Endpoint                                   │
├────────────┼────────┼────────────────────────────────────────────┤
│ Auth       │ POST   │ /api/v1/auth/login                         │
│            │ POST   │ /api/v1/auth/refresh                       │
│            │ POST   │ /api/v1/auth/logout                        │
├────────────┼────────┼────────────────────────────────────────────┤
│ Tasks      │ GET    │ /api/v1/tasks?page=0&size=20               │
│            │ POST   │ /api/v1/tasks                              │
│            │ GET    │ /api/v1/tasks/{id}                         │
│            │ PUT    │ /api/v1/tasks/{id}                         │
│            │ DELETE │ /api/v1/tasks/{id}                         │
│            │ PATCH  │ /api/v1/tasks/{id}/status                  │
├────────────┼────────┼────────────────────────────────────────────┤
│ Console H2 │ GET    │ /h2-console (ADMIN role requise)           │
└────────────┴────────┴────────────────────────────────────────────┘
```

**Détail de chaque endpoint :**

| Endpoint | Description | Corps requête | Réponse succès |
|---|---|---|---|
| `POST /auth/login` | Authentification et obtention des tokens | `{ email, password }` | `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: "3600" }` |
| `POST /auth/refresh` | Renouvellement du token d'accès | `{ refreshToken }` | `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: "3600" }` |
| `POST /auth/logout` | Invalidation du refresh token | `{ refreshToken }` | 200 OK |
| `GET /tasks` | Liste des tâches de l'utilisateur (paginée) | Query params: `page`, `size` | `{ content: Task[], totalElements, totalPages, number, size }` |
| `POST /tasks` | Création d'une nouvelle tâche | `{ title, description?, priority?, dueDate? }` | `TaskResponse` |
| `GET /tasks/{id}` | Détail d'une tâche (ownership check) | — | `TaskResponse` |
| `PUT /tasks/{id}` | Mise à jour complète d'une tâche | `{ title?, description?, priority?, dueDate? }` | `TaskResponse` |
| `DELETE /tasks/{id}` | Suppression soft d'une tâche | — | 204 No Content |
| `PATCH /tasks/{id}/status` | Changement de statut | `{ status: "TODO"\|"DOING"\|"DONE" }` | `TaskResponse` |

### 2.4 Flux d'authentification

L'authentification fonctionne avec un schéma JWT (JSON Web Token) à double tokens :

```
┌──────────────────────────────────────────────────────────────────┐
│               FLUX D'AUTHENTIFICATION COMPLET                     │
│                                                                  │
│  1. LOGIN                                                        │
│  ┌──────────┐    POST /auth/login     ┌──────────────────┐       │
│  │ Frontend │ ────────────────────►   │  AuthController  │       │
│  │          │ { email, password }     │                  │       │
│  │          │                         │  AuthService     │       │
│  │          │ ◄────────────────────   │  .authenticate() │       │
│  │          │ { accessToken,          │                  │       │
│  │          │  refreshToken,          │  • Vérifie les   │       │
│  │          │  expiresIn: "3600" }    │    credentials   │       │
│  └──────────┘                         │  • Génère JWT    │       │
│       │                               │  • Retourne pair │       │
│       │ Store dans localStorage       └──────────────────┘       │
│       ▼                                                           │
│  ┌───────────────────────────────┐                               │
│  │  localStorage                 │                               │
│  │  ┌─────────────────────────┐  │                               │
│  │  │ tasksphere_auth          │  │                               │
│  │  │ {                       │  │                               │
│  │  │   accessToken: "eyJ...", │  │                               │
│  │  │   refreshToken: "eyJ..", │  │                               │
│  │  │   email: "saadoune@...", │  │                               │
│  │  │   role: "USER",          │  │                               │
│  │  │   isAuthenticated: true, │  │                               │
│  │  │   tokenExpiry: 1735000000│  │                               │
│  │  │ }                       │  │                               │
│  │  └─────────────────────────┘  │                               │
│  └───────────────────────────────┘                               │
│                                                                  │
│  2. REQUÊTE AUTHENTIFIÉE                                         │
│  ┌──────────┐  GET /tasks  ┌────────────────┐  ┌──────────────┐  │
│  │ Frontend │ ───────────► │  JWT Filter    │─►│ TaskService  │  │
│  │          │ Authorization │  (Spring Sec.) │  │              │  │
│  │          │ Bearer eyJ... │                │  │ userId =     │  │
│  └──────────┘              └────────────────┘  │ jwt.subject  │  │
│                                                  └──────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Description du processus :**

1. L'utilisateur saisit ses identifiants dans le formulaire de connexion (`LoginForm.tsx`).
2. Le composant appelle `auth.login(email, password)` depuis le `AuthContext`.
3. L'`AuthContext` envoie une requête POST à `/api/v1/auth/login` via Axios.
4. Le backend valide les credentials, génère un access token (JWT) et un refresh token.
5. Le frontend décode le JWT (base64) pour extraire l'email (`sub`) et le rôle (`role`).
6. L'état d'authentification complet (tokens + métadonnées) est stocké dans le `localStorage` sous la clé `tasksphere_auth`.
7. Pour chaque requête ultérieure, l'interceptor Axios ajoute automatiquement le header `Authorization: Bearer <accessToken>`.

### 2.5 Schéma de la base de données

Le backend utilise une base de données H2 en mémoire pour le développement. Le schéma est simplifié :

```
┌──────────────────────────────────────────────────────────────────┐
│                    SCHÉMA BASE DE DONNÉES (H2)                   │
│                                                                  │
│  ┌─── users ───────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────────────┐   │  │
│  │  │ id (UUID)  │  │ email    │  │ password (BCrypt)     │   │  │
│  │  └────────────┘  └──────────┘  └──────────────────────┘   │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────────────────┐   │  │
│  │  │ role       │  │ enabled  │  │ created_at           │   │  │
│  │  │ (ENUM)     │  │ (BOOL)   │  │ (TIMESTAMP)          │   │  │
│  │  └────────────┘  └──────────┘  └──────────────────────┘   │  │
│  │                                                             │  │
│  │  Données initiales :                                        │  │
│  │    • saadoune@tasksphere.com    → USER                     │  │
│  │    • manager@tasksphere.com     → MANAGER                  │  │
│  │    • admin@tasksphere.com       → ADMIN                    │  │
│  │    (mot de passe commun : password123)                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           │                                                      │
│           │ 1:N (userId FK)                                      │
│           ▼                                                      │
│  ┌─── tasks ──────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  ┌────────────┐  ┌───────────┐  ┌──────────────────┐      │  │
│  │  │ id (UUID)  │  │ user_id   │  │ title (VARCHAR)   │      │  │
│  │  └────────────┘  └───────────┘  └──────────────────┘      │  │
│  │  ┌────────────┐  ┌───────────┐  ┌──────────────────┐      │  │
│  │  │ description│  │ status    │  │ priority         │      │  │
│  │  │ (TEXT)     │  │ (ENUM)    │  │ (ENUM)           │      │  │
│  │  └────────────┘  └───────────┘  └──────────────────┘      │  │
│  │  ┌────────────┐  ┌───────────┐  ┌──────────────────┐      │  │
│  │  │ due_date   │  │ completed │  │ created_at       │      │  │
│  │  │ (DATE)     │  │ _at (DT)  │  │ (TIMESTAMP)      │      │  │
│  │  └────────────┘  └───────────┘  └──────────────────┘      │  │
│  │  ┌──────────────────────────────────────────────────┐      │  │
│  │  │ deleted (BOOLEAN) — Soft delete                  │      │  │
│  │  └──────────────────────────────────────────────────┘      │  │
│  │                                                             │  │
│  │  ENUM status :   TODO → DOING → DONE                        │  │
│  │  ENUM priority :  LOW, MEDIUM, HIGH, CRITICAL               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Console H2 accessible : http://localhost:8080/h2-console        │
│  (Rôle ADMIN requis pour Spring Security)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Points clés du schéma :**

- La relation entre `users` et `tasks` est de type **1:N** (un utilisateur possède plusieurs tâches).
- Le champ `deleted` dans la table `tasks` implémente un **soft delete** : la tâche n'est jamais physiquement supprimée, elle est simplement marquée comme supprimée.
- Le mot de passe est haché avec **BCrypt**, un algorithme de hachage lent et salé, résistant aux attaques par brute force et rainbow tables.
- Le rôle est stocké directement dans la table `users` en tant qu'énumération (`USER`, `MANAGER`, `ADMIN`).

---

## 3. Architecture Frontend (Next.js)

### 3.1 Structure App Router

Le projet utilise le **App Router** de Next.js 14, qui organise l'application en répertoires basés sur le système de fichiers. Chaque dossier dans `src/app/` représente un segment de route :

```
┌──────────────────────────────────────────────────────────────────┐
│              STRUCTURE DU PROJET FRONTEND                         │
│                                                                  │
│  src/                                                            │
│  ├── app/                          # Routes App Router           │
│  │   ├── layout.tsx                # Layout racine (Server Comp) │
│  │   ├── page.tsx                  # Page d'accueil (/)          │
│  │   ├── globals.css               # Variables CSS + Tailwind     │
│  │   ├── tasks/                    # Route /tasks                │
│  │   │   ├── page.tsx              # Liste des tâches            │
│  │   │   └── [id]/                 # Route dynamique /tasks/:id  │
│  │   │       └── page.tsx          # Détail d'une tâche          │
│  │   └── ownership/                # Route /ownership            │
│  │       └── page.tsx              # Page de test ownership      │
│  │                                                              │
│  ├── components/                   # Composants React            │
│  │   ├── ui/                       # Composants shadcn/ui        │
│  │   │   ├── button.tsx            #                            │
│  │   │   ├── card.tsx              #                            │
│  │   │   ├── dialog.tsx            #                            │
│  │   │   ├── input.tsx             #                            │
│  │   │   ├── label.tsx             #                            │
│  │   │   ├── textarea.tsx          #                            │
│  │   │   ├── badge.tsx             #                            │
│  │   │   ├── skeleton.tsx          #                            │
│  │   │   └── sonner.tsx            # Wrapper Toaster Sonner     │
│  │   ├── AppLayout.tsx             # Layout authentifié          │
│  │   ├── Navbar.tsx                # Barre de navigation         │
│  │   ├── LoginForm.tsx             # Formulaire de connexion     │
│  │   ├── TaskCard.tsx              # Carte de tâche (résumé)     │
│  │   ├── TaskForm.tsx              # Formulaire CRUD tâche       │
│  │   ├── ConfirmDialog.tsx         # Dialogue de confirmation    │
│  │   └── TokenTimer.tsx            # Compteur token JWT          │
│  │                                                              │
│  ├── context/                      # Contextes React              │
│  │   └── AuthContext.tsx           # Contexte d'authentification  │
│  │                                                              │
│  ├── providers/                    # Providers React              │
│  │   └── QueryProvider.tsx         # Provider TanStack Query     │
│  │                                                              │
│  ├── hooks/                        # Hooks personnalisés          │
│  │   └── useTasks.ts              # Hooks CRUD + query keys      │
│  │                                                              │
│  ├── lib/                          # Utilitaires                 │
│  │   ├── api.ts                    # Client Axios + interceptors  │
│  │   └── utils.ts                  # Fonction cn() (shadcn)      │
│  │                                                              │
│  └── types/                        # Types TypeScript            │
│      └── index.ts                  # Interfaces + type guards     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Organisation en couches du frontend :**

```
┌──────────────────────────────────────────────────────────────────┐
│              COUCHES DE L'ARCHITECTURE FRONTEND                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  PAGES (src/app/)                                         │  │
│  │  Orchestration de l'IHM, assemblage des composants,       │  │
│  │  gestion de la navigation et des états locaux de page.    │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │  COMPOSANTS (src/components/)                              │  │
│  │  • ui/ : composants shadcn/ui réutilisables (primitives)  │  │
│  │  • Components métier : TaskCard, TaskForm, LoginForm, etc. │  │
│  │  • Layout : AppLayout, Navbar                             │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │  HOOKS (src/hooks/)                                        │  │
│  │  useMyTasksQuery, useCreateTaskMutation, etc.             │  │
│  │  Encapsulent TanStack Query + logique d'invalidation.     │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │  DATA LAYER (src/lib/api.ts + src/context/)               │  │
│  │  Client Axios avec interceptors JWT, AuthContext pour      │  │
│  │  l'état d'authentification, QueryProvider pour le cache.   │  │
│  └───────────────────────────┬────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼────────────────────────────────┐  │
│  │  TYPES (src/types/)                                        │  │
│  │  Interfaces TypeScript, type guards (isApiError),          │  │
│  │  énumérations de statut/priorité.                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Hiérarchie des composants

Le diagramme suivant montre la hiérarchie complète de rendu des composants, depuis le layout racine jusqu'aux composants atomiques shadcn/ui :

```
┌──────────────────────────────────────────────────────────────────┐
│              HIÉRARCHIE DES COMPOSANTS                           │
│                                                                  │
│  RootLayout (layout.tsx) ─── Server Component                    │
│  │                                                              │
│  ├── QueryProvider (TanStack Query)                              │
│  │   │                                                          │
│  │   └── AuthProvider (AuthContext)                              │
│  │       │                                                      │
│  │       ├── Toaster (Sonner) ◄── Toasts globaux                │
│  │       │                                                      │
│  │       └── Route: "/" ─── page.tsx (HomePage)                 │
│  │           │                                                  │
│  │           ├── [isLoading] → Skeleton placeholders             │
│  │           │   ├── Skeleton (titre)                           │
│  │           │   ├── Skeleton (sous-titre)                      │
│  │           │   └── Skeleton × 3 (champs formulaire)           │
│  │           │                                                  │
│  │           └── [!isAuthenticated] → LoginForm                  │
│  │               ├── Card, CardContent (shadcn/ui)              │
│  │               ├── Label + Input (email)                       │
│  │               ├── Label + Input (password)                    │
│  │               └── Button (connexion) + Quick login buttons    │
│  │                                                              │
│  └── Route: "/tasks" ─── page.tsx (TasksPage)                   │
│      │                                                          │
│      └── AppLayout                                              │
│          │                                                      │
│          ├── Navbar (React.memo)                                 │
│          │   ├── TokenTimer (React.memo)                        │
│          │   ├── Badge (rôle)                                   │
│          │   ├── Button × N (navigation)                        │
│          │   └── Button (déconnexion)                           │
│          │                                                      │
│          ├── Main Content                                       │
│          │   ├── [isLoading] → Skeleton grid (6 cartes)         │
│          │   │                                                  │
│          │   ├── [showCreateForm] → TaskForm (mode="create")    │
│          │   │   ├── Input (titre)                               │
│          │   │   ├── Textarea (description)                     │
│          │   │   ├── Priority buttons                           │
│          │   │   ├── Input date (échéance)                      │
│          │   │   └── Button (soumettre)                         │
│          │   │                                                  │
│          │   ├── TaskCard × N (React.memo)                      │
│          │   │   ├── Card, CardContent (shadcn/ui)              │
│          │   │   ├── Badge (statut)                             │
│          │   │   ├── Badge (priorité)                           │
│          │   │   └── Button (voir / avancer / supprimer)        │
│          │   │                                                  │
│          │   └── Pagination (ChevronLeft / ChevronRight)        │
│          │                                                      │
│          ├── ConfirmDialog                                      │
│          │   └── Dialog (shadcn/ui + Radix)                     │
│          │                                                      │
│          └── Footer                                              │
│                                                                  │
│  └── Route: "/tasks/:id" ─── page.tsx (TaskDetailPage)          │
│      │                                                          │
│      └── AppLayout → (même structure Navbar/Footer)              │
│          │                                                      │
│          ├── [isLoading] → Skeleton layout 3 colonnes           │
│          │                                                      │
│          └── Task Detail                                        │
│              ├── Colonne principale (2/3)                       │
│              │   ├── Header (titre + badges + bouton modifier)  │
│              │   ├── [isEditing] → TaskForm (mode="edit")       │
│              │   ├── Description                                │
│              │   └── Changement de statut (3 boutons)           │
│              │                                                  │
│              └── Colonne latérale (1/3)                         │
│                  ├── Détails (ID, userId, dates)               │
│                  └── Zone de danger (bouton supprimer)         │
│                                                                  │
│  └── Route: "/ownership" ─── page.tsx (OwnershipPage)           │
│      │                                                          │
│      └── AppLayout → Tests automatisés d'ownership RBAC         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Gestion de l'état

L'application utilise trois mécanismes complémentaires de gestion d'état :

```
┌──────────────────────────────────────────────────────────────────┐
│              STRATÉGIES DE GESTION D'ÉTAT                        │
│                                                                  │
│  1. AUTHCONTEXT (AuthContext.tsx) ─── État d'authentification    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  • State : useState<AuthState>                              │  │
│  │  • Persistance : localStorage ("tasksphere_auth")           │  │
│  │  • Portée : Global (toute l'app via Context.Provider)       │  │
│  │  • Exposé via : useAuth() hook                             │  │
│  │  • Contient : accessToken, refreshToken, email, role,      │  │
│  │               isAuthenticated, tokenExpiry                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  2. TANSTACK QUERY (QueryProvider.tsx + hooks) ─── État serveur  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  • QueryClient : singleton par session                      │  │
│  │  • staleTime : 30s par défaut, 0 pour les tâches            │  │
│  │  • gcTime : 5 minutes (garbage collection)                  │  │
│  │  • Invalidation : mutations → invalidateQueries()           │  │
│  │  • Hooks : useMyTasksQuery, useTaskQuery, use*Mutation      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  3. LOCAL STATE (useState dans les pages) ─── État UI transitoire│
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  • currentPage (pagination)                                │  │
│  │  • showCreateForm (formulaire d'ajout)                     │  │
│  │  • deleteId (confirmation de suppression)                  │  │
│  │  • isEditing (mode édition dans le détail)                 │  │
│  │  • showDelete (dialogue de suppression)                    │  │
│  │  • results (page ownership)                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Pourquoi cette séparation ?**

- **AuthContext** : L'état d'authentification doit être accessible partout (Navbar, AppLayout, pages). Le Context API est parfait pour cela car il évite le "prop drilling" (passer les props manuellement à chaque niveau).

- **TanStack Query** : Les données serveur (tâches) ont un cycle de vie complexe : chargement, cache, invalidation, erreur. TanStack Query gère tout cela automatiquement, éliminant le besoin de `useEffect` + `useState` manuels pour les appels API.

- **Local State** : L'état purement UI (un formulaire ouvert/fermé, la page de pagination courante) n'a pas besoin d'être partagé ni mis en cache. Un simple `useState` local suffit et reste plus performant.

---

## 4. Connexion Frontend ↔ Backend

### 4.1 Le proxy Next.js (Rewrites)

La communication entre le frontend (port 3000) et le backend (port 8080) est gérée par le système de **rewrites** de Next.js. Ce mécanisme est configuré dans `next.config.js` :

```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8080/api/:path*',
    },
  ];
}
```

**Pourquoi un proxy et pas des appels directs ?**

```
┌──────────────────────────────────────────────────────────────────┐
│            PROBLÈME SANS PROXY (CORS)                            │
│                                                                  │
│  Navigateur (localhost:3000)                                     │
│       │                                                          │
│       │ fetch("http://localhost:8080/api/v1/tasks")              │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐     ┌──────────────────────────────┐        │
│  │  Navigateur     │     │  Backend (localhost:8080)     │        │
│  │                 │ ──► │                              │        │
│  │  Origine :      │     │  ❌ CORS REJECTED !          │        │
│  │  localhost:3000 │     │  Access-Control-Allow-Origin │        │
│  │                 │     │  ne contient pas :3000       │        │
│  └─────────────────┘     └──────────────────────────────┘        │
│                                                                  │
│  Le navigateur bloque la requête car les ports sont différents   │
│  (3000 ≠ 8080) → considéré comme cross-origin par le navigateur. │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│            SOLUTION AVEC PROXY (REWRITES)                        │
│                                                                  │
│  Navigateur (localhost:3000)                                     │
│       │                                                          │
│       │ fetch("/api/v1/tasks")   ◄── Même origine !             │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────┐    ┌──────────────────────────┐     │
│  │  Next.js Server          │    │  Backend                  │     │
│  │  (localhost:3000)        │    │  (localhost:8080)          │     │
│  │                         │    │                           │     │
│  │  Rewrite :               │    │                           │     │
│  │  /api/* ──────────────── │───►│  Reçoit la requête        │     │
│  │  ──► localhost:8080/api/* │    │  server-to-server         │     │
│  │                         │    │  (pas de CORS !)           │     │
│  │  Réponse transmise       │◄───│                           │     │
│  │  au navigateur           │    │                           │     │
│  └─────────────────────────┘    └──────────────────────────┘     │
│                                                                  │
│  Le navigateur voit une requête SAME-ORIGIN (port 3000 → 3000). │
│  Le serveur Next.js la transfère au backend côté serveur.        │
│  La politique CORS ne s'applique qu'aux requêtes navigateur.     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Points importants :**

- Le proxy fonctionne uniquement en **développement** avec `next dev`. En production, un reverse proxy (Nginx, Traefik) ou un API Gateway prendrait le relais.
- Le client Axios est configuré avec `baseURL: '/api/v1'`, donc `api.get('/tasks')` devient réellement `GET /api/v1/tasks` qui est réécrit vers `http://localhost:8080/api/v1/tasks`.
- Toute la configuration CORS côté navigateur est ainsi évitée : pas de headers `Access-Control-Allow-Origin` nécessaires dans les réponses.

### 4.2 Flux JWT complet avec diagrammes

Le système d'authentification JWT implémente un flux complet avec login, utilisation du token, et refresh automatique. Voici le cycle de vie complet :

```
┌──────────────────────────────────────────────────────────────────┐
│              CYCLE DE VIE COMPLET DU JWT                          │
│                                                                  │
│  ═══ PHASE 1 : LOGIN ══════════════════════════════════════      │
│                                                                  │
│  Utilisateur      AuthContext        Axios         Backend        │
│       │               │               │               │          │
│       │ login()       │               │               │          │
│       │──────────────►│               │               │          │
│       │               │ api.post()    │               │          │
│       │               │──────────────►│               │          │
│       │               │               │ POST /auth/   │          │
│       │               │               │ login         │          │
│       │               │               │──────────────►│          │
│       │               │               │               │ Validate │
│       │               │               │               │ creds    │
│       │               │               │  { accessToken,          │
│       │               │               │  refreshToken, │          │
│       │               │               │  expiresIn }   │          │
│       │               │               │◄──────────────│          │
│       │               │ Decode JWT    │               │          │
│       │               │ (base64)      │               │          │
│       │               │ → sub, role   │               │          │
│       │               │ Store         │               │          │
│       │               │ localStorage  │               │          │
│       │  toast.success│               │               │          │
│       │◄──────────────│               │               │          │
│       │  router.push  │               │               │          │
│       │  /tasks       │               │               │          │
│       ▼               ▼               ▼               ▼          │
│                                                                  │
│  ═══ PHASE 2 : REQUÊTE AUTORISÉE ════════════════════════       │
│                                                                  │
│  Composant      Axios Interceptor      Backend                   │
│       │               │                   │                     │
│       │ useMyTasks() │                   │                     │
│       │──────────────►│                   │                     │
│       │               │ Lit localStorage  │                     │
│       │               │ → accessToken     │                     │
│       │               │ Injecte header :  │                     │
│       │               │ Authorization:   │                     │
│       │               │ Bearer eyJ...    │                     │
│       │               │                   │                     │
│       │               │ GET /api/v1/tasks │                     │
│       │               │──────────────────►│                     │
│       │               │                   │ JWT Filter          │
│       │               │                   │ → Valide signature │
│       │               │                   │ → Extrait userId   │
│       │               │                   │ → Charge Security  │
│       │               │   200 OK          │   Context           │
│       │               │   { tasks... }    │                     │
│       │               │◄──────────────────│                     │
│       │  data.tasks   │                   │                     │
│       │◄──────────────│                   │                     │
│       ▼               ▼                   ▼                     │
│                                                                  │
│  ═══ PHASE 3 : REFRESH AUTOMATIQUE ══════════════════════       │
│                                                                  │
│  Composant     Axios Interceptor     Backend                     │
│       │               │                   │                     │
│       │ useMyTasks() │                   │                     │
│       │──────────────►│                   │                     │
│       │               │ Injecte token     │                     │
│       │               │──────────────────►│                     │
│       │               │                   │                     │
│       │               │   401 UNAUTHORIZED│ ◄── Token expiré    │
│       │               │◄──────────────────│                     │
│       │               │                   │                     │
│       │               │ isRefreshing=true  │                     │
│       │               │ POST /auth/refresh │                     │
│       │               │ { refreshToken }   │                     │
│       │               │──────────────────►│                     │
│       │               │   { new accessToken,                    │
│       │               │     new refreshToken }                  │
│       │               │◄──────────────────│                     │
│       │               │                   │                     │
│       │               │ Met à jour        │                     │
│       │               │ localStorage      │                     │
│       │               │ + AuthContext     │                     │
│       │               │                   │                     │
│       │               │ Rejoue la requête │                     │
│       │               │ originale avec    │                     │
│       │               │ le nouveau token  │                     │
│       │               │──────────────────►│                     │
│       │               │   200 OK          │                     │
│       │               │◄──────────────────│                     │
│       │               │ isRefreshing=false │                     │
│       │  data         │                   │                     │
│       │◄──────────────│                   │                     │
│       ▼               ▼                   ▼                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.3 Mécanisme de refresh avec file d'attente

Le fichier `src/lib/api.ts` implémente un mécanisme sophistiqué de file d'attente pendant le refresh. C'est un pattern crucial pour éviter des refreshs simultanés quand plusieurs requêtes échouent en même temps avec un 401 :

```
┌──────────────────────────────────────────────────────────────────┐
│         FILE D'ATTENTE DE REFRESH (failedQueue)                  │
│                                                                  │
│  Timeline :                                                      │
│                                                                  │
│  t=0ms   Requête A (GET /tasks) ──────── 401 Expired            │
│  t=5ms   Requête B (GET /tasks/123) ──── 401 Expired            │
│  t=10ms  Requête C (PATCH /tasks/456) ── 401 Expired            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Processus de traitement :                                │    │
│  │                                                           │    │
│  │  t=0ms  Requête A reçoit 401                              │    │
│  │         → isRefreshing = true                             │    │
│  │         → Lance refreshCallback()                         │    │
│  │                                                           │    │
│  │  t=5ms  Requête B reçoit 401                              │    │
│  │         → isRefreshing est déjà true                      │    │
│  │         → B est mise dans failedQueue                     │    │
│  │         → B retourne une Promise en attente               │    │
│  │                                                           │    │
│  │  t=10ms Requête C reçoit 401                              │    │
│  │         → isRefreshing est déjà true                      │    │
│  │         → C est mise dans failedQueue                     │    │
│  │         → C retourne une Promise en attente               │    │
│  │                                                           │    │
│  │  t=200ms Refresh terminé avec succès                      │    │
│  │         → newToken = "eyJ..."                              │    │
│  │         → processQueue(null, newToken)                     │    │
│  │            ├── Résout la Promise de B                     │    │
│  │            │   → B rejouée avec nouveau token              │    │
│  │            └── Résout la Promise de C                     │    │
│  │                → C rejouée avec nouveau token              │    │
│  │         → A est rejouée directement (originalRequest)     │    │
│  │         → isRefreshing = false                             │    │
│  │                                                           │    │
│  │  RÉSULTAT :                                                │    │
│  │    1 seul refresh exécuté (pas de race condition)          │    │
│  │    Toutes les requêtes ont été rejouées avec succès        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Cas d'échec du refresh :                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Si refreshCallback() échoue ou retourne null :           │    │
│  │                                                           │    │
│  │  1. processQueue(error, null) → rejette toutes les        │    │
│  │     Promises en attente                                   │    │
│  │  2. tokenUpdateCallback() → reset AuthState               │    │
│  │  3. localStorage.removeItem('tasksphere_auth')            │    │
│  │  4. window.location.href = '/' → redirection vers login   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Pourquoi ce pattern est-il essentiel ?**

Imaginez un scénario sans file d'attente : trois composants se montent simultanément (Navbar, TaskList, TaskDetail). Chacun fait un appel API. Le token vient d'expirer. Sans la file d'attente, les trois requêtes lanceraient chacune un refresh indépendamment, causant trois appels réseau inutiles et potentiellement des incohérences de token. Le pattern `failedQueue` garantit exactement **un seul refresh** et la **rejoue** de toutes les requêtes en attente avec le nouveau token.

### 4.4 Gestion des erreurs

Le frontend implémente une gestion d'erreurs structurée à plusieurs niveaux :

```
┌──────────────────────────────────────────────────────────────────┐
│              STRATÉGIE DE GESTION DES ERREURS                    │
│                                                                  │
│  NIVEAU 1 : Type Guards TypeScript                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  isApiError(error: unknown) → boolean                      │  │
│  │                                                             │  │
│  │  Avant (B1/B2 - dangereux) :                                │  │
│  │    const err = error as { response?: { data?: { message } }}│  │
│  │    // ❌ Pas de vérification runtime, crash si format diff.  │  │
│  │                                                             │  │
│  │  Après (corrigé) :                                           │  │
│  │    if (isApiError(error)) {                                  │  │
│  │      error.response.data.error   // ✅ TypeScript le sait   │  │
│  │      error.response.data.message // ✅ Type-safe             │  │
│  │      error.response.status      // ✅ Numérique              │  │
│  │    }                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  NIVEAU 2 : TanStack Query (mutations)                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  onSuccess: () => {                                         │  │
│  │    queryClient.invalidateQueries(...)  // Rafraîchit le cache│  │
│  │    toast.success('Tâche créée')      // Feedback utilisateur │  │
│  │  }                                                          │  │
│  │  onError: (error) => {                                      │  │
│  │    toast.error('Erreur', {                                  │  │
│  │      description: error.message                              │  │
│  │    })                                                       │  │
│  │  }                                                          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  NIVEAU 3 : Format d'erreur backend standardisé                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Le GlobalExceptionHandler du backend retourne toujours :    │  │
│  │  {                                                         │  │
│  │    "timestamp": "2025-01-15T10:30:00",                     │  │
│  │    "status": 404,                                          │  │
│  │    "error": "Not Found",                                   │  │
│  │    "message": "Task not found",                            │  │
│  │    "details": "No task with id xxx exists",                │  │
│  │    "path": "/api/v1/tasks/xxx"                             │  │
│  │  }                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  NIVEAU 4 : Axios Interceptor (401 global)                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Si 401 → tentative de refresh automatique                  │  │
│  │  Si refresh échoue → déconnexion + redirection /           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Intégration shadcn/ui

### 5.1 Qu'est-ce que shadcn/ui ?

shadcn/ui n'est pas une bibliothèque de composants traditionnelle. C'est un **générateur de code** qui copie les composants directement dans votre projet. Contrairement à Material-UI ou Chakra UI, vous possédez le code source — pas de node_modules opaque, pas de mise à jour cassante.

**La stack technologique sous-jacente :**

```
┌──────────────────────────────────────────────────────────────────┐
│              STACK SHADCN/UI — COMMENT ÇA MARCHE                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  shadcn/ui CLI (npx shadcn@latest add button)           │    │
│  │                                                           │    │
│  │  Génère le code et le COPIE dans :                        │    │
│  │  src/components/ui/button.tsx                             │    │
│  │                                                           │    │
│  │  Vous êtes PROPRIÉTAIRE du code. Vous pouvez le modifier. │    │
│  └──────────────────────────────────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  3 PILIERS TECHNOLOGIQUES                                │    │
│  │                                                           │    │
│  │  ┌─────────────────────────────────────────────────────┐ │    │
│  │  │ 1. Radix UI ( primitives sans style )               │ │    │
│  │  │                                                     │ │    │
│  │  │ Composants "headless" : accessibilité (a11y),       │ │    │
│  │  │ gestion clavier, ARIA, focus trap, portail DOM.     │ │    │
│  │  │                                                     │ │    │
│  │  │ Exemple : Radix Dialog                              │ │    │
│  │  │ • Ouvre un portail <dialog> dans le DOM             │ │    │
│  │  │ • Gère le focus trap (Tab ne sort pas de la modal)  │ │    │
│  │  │ • Ferme sur Escape                                   │ │    │
│  │  │ • Masque le reste (aria-hidden sur les autres)      │ │    │
│  │  │ • Gère le focus automatique                          │ │    │
│  │  │ • Accessible : rôle dialog, aria-labelledby          │ │    │
│  │  │                                                     │ │    │
│  │  │ Sans style CSS par défaut — c'est shadcn/ui qui     │ │    │
│  │  │ ajoute le style visuel.                              │ │    │
│  │  └─────────────────────────────────────────────────────┘ │    │
│  │                                                           │    │
│  │  ┌─────────────────────────────────────────────────────┐ │    │
│  │  │ 2. CVA — Class Variance Authority                   │ │    │
│  │  │                                                     │ │    │
│  │  │ Crée des composants à variantes typées :            │ │    │
│  │  │                                                     │ │    │
│  │  │ const buttonVariants = cva("base-class", {          │ │    │
│  │  │   variants: {                                       │ │    │
│  │  │     variant: {                                      │ │    │
│  │  │       default: "bg-primary text-primary-foreground",│ │    │
│  │  │       destructive: "bg-destructive text-white",     │ │    │
│  │  │       outline: "border border-input bg-background", │ │    │
│  │  │       secondary: "bg-secondary text-secondary-fg",  │ │    │
│  │  │       ghost: "hover:bg-accent",                     │ │    │
│  │  │     },                                              │ │    │
│  │  │     size: {                                         │ │    │
│  │  │       default: "h-10 px-4 py-2",                    │ │    │
│  │  │       sm: "h-9 rounded-md px-3",                    │ │    │
│  │  │       lg: "h-11 rounded-md px-8",                   │ │    │
│  │  │       icon: "h-10 w-10",                            │ │    │
│  │  │     }                                               │ │    │
│  │  │   }                                                 │ │    │
│  │  │ })                                                  │ │    │
│  │  │                                                     │ │    │
│  │  │ Avantage : TypeScript déduit le type des variantes. │ │    │
│  │  │ <Button variant="destructive"> → ✅ autocomplete     │ │    │
│  │  │ <Button variant="foobar">     → ❌ erreur TS         │ │    │
│  │  └─────────────────────────────────────────────────────┘ │    │
│  │                                                           │    │
│  │  ┌─────────────────────────────────────────────────────┐ │    │
│  │  │ 3. cn() — Fusion intelligente de classes Tailwind   │ │    │
│  │  │                                                     │ │    │
│  │  │ // src/lib/utils.ts                                  │ │    │
│  │  │ import { clsx } from "clsx";                         │ │    │
│  │  │ import { twMerge } from "tailwind-merge";            │ │    │
│  │  │                                                     │ │    │
│  │  │ export function cn(...inputs: ClassValue[]) {         │ │    │
│  │  │   return twMerge(clsx(inputs));                      │ │    │
│  │  │ }                                                   │ │    │
│  │  │                                                     │ │    │
│  │  │ clsx : fusionne conditionnellement les classes       │ │    │
│  │  │   cn("base", isActive && "active", "always")         │ │    │
│  │  │   → "base active always"                              │ │    │
│  │  │                                                     │ │    │
│  │  │ twMerge : résout les conflits Tailwind               │ │    │
│  │  │   cn("p-4", "p-2")  → "p-2" (le dernier gagne)      │ │    │
│  │  │   cn("text-red-500", "text-blue-500")                │ │    │
│  │  │     → "text-blue-500" (pas de conflit CSS)           │ │    │
│  │  └─────────────────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Configuration du projet

Le fichier `components.json` configure shadcn/ui pour le projet TaskSphere :

- **Style :** `new-york` (variante de design avec des bordures plus subtiles)
- **Base color :** `neutral` (couleur de base grise neutre)
- **CSS Variables :** activées (thème personnalisable via HSL dans `globals.css`)
- **RSC :** `true` (compatible React Server Components)
- **Préfixe :** vide (pas de préfixe CSS personnalisé)

### 5.3 Liste des composants installés

```
┌──────────────────────────────────────────────────────────────────┐
│              COMPOSANTS SHADCN/UI INSTALLÉS                      │
├────────────────┬──────────────┬─────────────────────────────────┤
│ Composant      │ Fichier      │ Utilisation dans le projet       │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Button         │ button.tsx   │ LoginForm, TaskForm, Navbar,    │
│                │              │ TaskCard, ConfirmDialog,         │
│                │              │ pagination, boutons d'action     │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Card           │ card.tsx     │ LoginForm (conteneur),           │
│                │              │ TaskCard (carte de tâche)        │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Input          │ input.tsx    │ LoginForm (email/password),      │
│                │              │ TaskForm (titre/date)            │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Label          │ label.tsx    │ Association avec Input/Textarea  │
│                │              │ (accessibilité)                  │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Textarea       │ textarea.tsx │ TaskForm (description)           │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Badge          │ badge.tsx    │ Statut tâche (TODO/DOING/DONE), │
│                │              │ Priorité (LOW-CRITICAL),         │
│                │              │ Rôle utilisateur (Navbar),       │
│                │              │ TokenTimer                       │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Dialog         │ dialog.tsx   │ ConfirmDialog (suppression de   │
│                │              │ tâche) — basé sur Radix UI       │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Skeleton       │ skeleton.tsx │ États de chargement partout :   │
│                │              │ HomePage, AppLayout, TasksPage,  │
│                │              │ TaskDetailPage (élimine le flash  │
│                │              │ blanc au chargement)             │
├────────────────┼──────────────┼─────────────────────────────────┤
│ Sonner         │ sonner.tsx   │ Wrapper du Toaster Sonner       │
│                │              │ configuré en position            │
│                │              │ bottom-right avec richColors     │
└────────────────┴──────────────┴─────────────────────────────────┘
```

---

## 6. TanStack Query

### 6.1 Qu'est-ce que TanStack Query ?

TanStack Query (anciennement React Query) est une bibliothèque de gestion de **state serveur**. Elle résout le problème fondamental suivant : les données qui viennent d'une API ont un cycle de vie complexe (chargement, succès, erreur, péremption, invalidation) que les `useState` + `useEffect` traditionnels gèrent mal.

**Sans TanStack Query (approche traditionnelle) :**

```typescript
// ❌ Problématique : beaucoup de code boilerplate
const [tasks, setTasks] = useState<Task[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setIsLoading(true);
  api.get('/tasks').then(res => {
    setTasks(res.data.content);
    setIsLoading(false);
  }).catch(err => {
    setError(err.message);
    setIsLoading(false);
  });
}, []); // ❌ Pas de retry, pas de cache, pas d'invalidation
```

**Avec TanStack Query :**

```typescript
// ✅ Concis, puissant, avec cache automatique
const { data, isLoading, error } = useMyTasksQuery(0, 20);
// Cache, retry automatique, invalidation, stale time — tout est géré
```

### 6.2 Pourquoi TanStack Query dans TaskSphere ?

```
┌──────────────────────────────────────────────────────────────────┐
│              AVANTAGES TANSTACK QUERY DANS TASKSPHERE             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. CACHE AUTOMATIQUE                                       │  │
│  │    Quand on navigue de /tasks → /tasks/123 → /tasks :     │  │
│  │    → La liste est encore en cache, pas de rechargement     │  │
│  │    → L'expérience est instantanée                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 2. INVALIDATION AUTOMATIQUE APRÈS MUTATION                  │  │
│  │                                                            │  │
│  │    Création d'une tâche :                                  │  │
│  │      → onSuccess: invalidateQueries({ queryKey: ['tasks', │  │
│  │        'list'] })                                         │  │
│  │      → Le cache de la liste est invalidé                  │  │
│  │      → TanStack Query refetch automatiquement              │  │
│  │      → L'utilisateur voit la nouvelle tâche immédiatement   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 3. GESTION DES LOADING/ERROR BUILT-IN                     │  │
│  │                                                            │  │
│  │    isLoading  → true pendant le fetch                     │  │
│  │    isError    → true si le fetch échoue                   │  │
│  │    isPending  → alias de isLoading (mutation en cours)    │  │
│  │    error      → l'objet erreur automatiquement rempli     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 4. RETRY AUTOMATIQUE                                      │  │
│  │    Si une requête échoue (network error, 500), TanStack   │  │
│  │    Query réessaie automatiquement 3 fois avec backoff.    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 5. PAS DE PROP DRILLING                                   │  │
│  │    Plus besoin de passer isLoading/error via les props.   │  │
│  │    Chaque composant appelle son hook directement.         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Query Keys Factory

Les query keys sont la colonne vertébrale du système de cache TanStack Query. Elles servent à identifier de manière unique chaque requête pour le cache, l'invalidation et le garbage collection.

```typescript
// src/hooks/useTasks.ts
export const taskKeys = {
  all:       ['tasks'],                              // Base
  lists:     () => [...taskKeys.all, 'list'],        // Toutes les listes
  list:      (page, size) => [...taskKeys.lists(),   // Liste spécifique
                           { page, size }],
  details:   () => [...taskKeys.all, 'detail'],      // Tous les détails
  detail:    (id) => [...taskKeys.details(), id],    // Détail spécifique
};
```

**Pourquoi une factory et pas des chaînes en dur ?**

```
┌──────────────────────────────────────────────────────────────────┐
│              POURQUOI UNE QUERY KEYS FACTORY ?                   │
│                                                                  │
│  ❌ SANS FACTORY :                                               │
│     useQuery({ queryKey: ['tasks'], ... })           // page.tsx │
│     useQuery({ queryKey: ['tasks', page], ... })     // page.tsx │
│     useQuery({ queryKey: ['task-detail', id], ... }) // [id].tsx │
│                                                                  │
│     // Invalidation après suppression :                          │
│     queryClient.invalidateQueries({ queryKey: ['tasks'] })       │
│     // ❌ N'invalide PAS ['task-detail', id] !                  │
│     // ❌ Les données détaillées deviennent stale               │
│                                                                  │
│  ✅ AVEC FACTORY :                                               │
│     // Invalidation par préfixe :                               │
│     queryClient.invalidateQueries({                              │
│       queryKey: taskKeys.lists()  // → ['tasks', 'list']       │
│     })                                                          │
│     // ✅ Invalide TOUTES les clés commençant par ['tasks',    │
│     //    'list'] : page 0, page 1, page 2, etc.               │
│                                                                  │
│     // Invalidation d'un détail spécifique :                    │
│     queryClient.invalidateQueries({                              │
│       queryKey: taskKeys.detail(id) // → ['tasks','detail',id] │
│     })                                                          │
│                                                                  │
│  Relation hiérarchique des clés :                                │
│                                                                  │
│  ['tasks']                         ← taskKeys.all              │
│    ├── ['tasks', 'list']           ← taskKeys.lists()          │
│    │     ├── ['tasks','list',{0,20}]  ← taskKeys.list(0,20)   │
│    │     ├── ['tasks','list',{1,20}]  ← taskKeys.list(1,20)   │
│    │     └── ['tasks','list',{2,20}]  ← taskKeys.list(2,20)   │
│    └── ['tasks', 'detail']         ← taskKeys.details()       │
│          ├── ['tasks','detail','abc'] ← taskKeys.detail('abc')│
│          ├── ['tasks','detail','def'] ← taskKeys.detail('def')│
│          └── ['tasks','detail','ghi'] ← taskKeys.detail('ghi')│
│                                                                  │
│  Invalider taskKeys.lists() affecte TOUTES les pages de liste.  │
│  Invalider taskKeys.all affecte TOUT (listes + détails).        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Hooks disponibles

```
┌──────────────────────────────────────────────────────────────────┐
│              HOOKS TANSTACK QUERY — useTasks.ts                   │
│                                                                  │
│  ┌── HOOKS DE LECTURE (Queries) ──────────────────────────────┐  │
│  │                                                            │  │
│  │  useMyTasksQuery(page, size)                               │  │
│  │  ├── queryKey: ['tasks', 'list', { page, size }]           │  │
│  │  ├── queryFn: getMyTasks(page, size)                       │  │
│  │  ├── staleTime: 0  ← Toujours refetch                      │  │
│  │  └── Retourne: { data, isLoading, error }                  │  │
│  │                                                            │  │
│  │  useTaskQuery(id)                                          │  │
│  │  ├── queryKey: ['tasks', 'detail', id]                     │  │
│  │  ├── queryFn: getTaskById(id)                              │  │
│  │  ├── enabled: !!id  ← Pas de fetch si id est vide          │  │
│  │  ├── staleTime: 0  ← Toujours refetch                      │  │
│  │  └── Retourne: { data, isLoading, error, isError }        │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── HOOKS D'ÉCRITURE (Mutations) ────────────────────────────┐  │
│  │                                                            │  │
│  │  useCreateTaskMutation()                                   │  │
│  │  ├── mutationFn: createTask(data)                          │  │
│  │  ├── onSuccess: invalidateQueries(taskKeys.lists())        │  │
│  │  │   + toast.success('Tâche créée')                        │  │
│  │  └── onError: toast.error('Erreur création')               │  │
│  │                                                            │  │
│  │  useUpdateTaskMutation(id)                                 │  │
│  │  ├── mutationFn: updateTask(id, data)                      │  │
│  │  ├── onSuccess: invalidateQueries(taskKeys.lists())        │  │
│  │  │   + invalidateQueries(taskKeys.detail(id))              │  │
│  │  │   + toast.success('Tâche mise à jour')                  │  │
│  │  └── onError: toast.error('Erreur mise à jour')            │  │
│  │                                                            │  │
│  │  useUpdateTaskStatusMutation()                             │  │
│  │  ├── mutationFn: ({ id, status }) => updateTaskStatus()   │  │
│  │  ├── onSuccess: invalidateQueries(taskKeys.lists())        │  │
│  │  │   + invalidateQueries(taskKeys.detail(variables.id))    │  │
│  │  │   + toast.success('Statut mis à jour')                  │  │
│  │  └── onError: toast.error('Erreur statut')                 │  │
│  │                                                            │  │
│  │  useDeleteTaskMutation()                                   │  │
│  │  ├── mutationFn: deleteTask(id)                            │  │
│  │  ├── onSuccess: invalidateQueries(taskKeys.lists())        │  │
│  │  │   + toast.success('Tâche supprimée')                    │  │
│  │  └── onError: toast.error('Erreur suppression')            │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── FONCTIONS API DIRECTES (sans cache) ─────────────────────┐  │
│  │                                                            │  │
│  │  Utilisées par la page /ownership pour des tests avec      │  │
│  │  données toujours fraîches (pas de cache TanStack Query)   │  │
│  │                                                            │  │
│  │  createTask, getMyTasks, getTaskById, updateTask,          │  │
│  │  updateTaskStatus, deleteTask                               │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5 Stratégie d'invalidation du cache

```
┌──────────────────────────────────────────────────────────────────┐
│              STRATÉGIE D'INVALIDATION                             │
│                                                                  │
│  Configuration globale (QueryProvider.tsx) :                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  staleTime : 30_000 ms (30 secondes)                     │    │
│  │  → Les données sont considérées "fraîches" pendant 30s   │    │
│  │  → TanStack ne refetch PAS si on réutilise la clé        │    │
│  │  → Après 30s : les données sont "stale" mais toujours    │    │
│  │    servies depuis le cache (refetch en arrière-plan)     │    │
│  │                                                           │    │
│  │  gcTime : 300_000 ms (5 minutes)                          │    │
│  │  → Les données inutilisées sont gardées 5 min en cache   │    │
│  │  → Après 5 min sans utilisation : garbage collected      │    │
│  │                                                           │    │
│  │  refetchOnWindowFocus : false                              │    │
│  │  → Ne refetch PAS quand l'utilisateur revient sur l'onglet│    │
│  │  → Évite les appels réseau inutiles                      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Exception pour les tâches (staleTime: 0) :                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  useMyTasksQuery : staleTime: 0                           │    │
│  │  useTaskQuery   : staleTime: 0                           │    │
│  │                                                           │    │
│  │  → Les tâches sont TOUJOURS considérées stale            │    │
│  │  → À chaque mount du composant → refetch garanti         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Mapping des invalidations :                                     │
│                                                                  │
│  ┌───────────────────┐  Invalide  ┌─────────────────────────┐   │
│  │ CREATE task       │───────────►│ taskKeys.lists()        │   │
│  │                   │           │ → Toutes les pages       │   │
│  ├───────────────────┤  Invalide  ├─────────────────────────┤   │
│  │ UPDATE task       │───────────►│ taskKeys.lists()        │   │
│  │                   │           │ taskKeys.detail(id)      │   │
│  │                   │           │ → Liste + détail         │   │
│  ├───────────────────┤  Invalide  ├─────────────────────────┤   │
│  │ UPDATE STATUS     │───────────►│ taskKeys.lists()        │   │
│  │                   │           │ taskKeys.detail(id)      │   │
│  ├───────────────────┤  Invalide  ├─────────────────────────┤   │
│  │ DELETE task       │───────────►│ taskKeys.lists()        │   │
│  │                   │           │ → Liste uniquement       │   │
│  │                   │           │ (le détail n'existe plus) │   │
│  └───────────────────┴───────────┴─────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.6 Pourquoi `staleTime: 0` pour les tâches ?

Le choix de `staleTime: 0` pour les requêtes de tâches est un **choix architectural conscient**. Voici le raisonnement :

```
┌──────────────────────────────────────────────────────────────────┐
│              POURQUOI staleTime: 0 POUR LES TÂCHES ?              │
│                                                                  │
│  Contexte :                                                      │
│  TaskSphere est une application multi-utilisateur. Plusieurs      │
│  personnes peuvent modifier les tâches simultanément (dans un    │
│  scénario d'équipe, même si chaque user voit ses propres tâches). │
│                                                                  │
│  Avec staleTime: 30s (défaut) :                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  1. Utilisateur ouvre /tasks → fetch initial             │    │
│  │  2. Navigue vers /tasks/123 → détail chargé              │    │
│  │  3. Modifie le statut → mutation → invalidation           │    │
│  │  4. Revient à /tasks → DONNÉES DU CACHE (30s)           │    │
│  │                                                           │    │
│  │  ⚠️ Si le statut a été modifié entre-temps par le       │    │
│  │     backend (ex: traitement asynchrone, webhook),        │    │
│  │     l'utilisateur voit des données périmées.             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Avec staleTime: 0 :                                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  1. Utilisateur ouvre /tasks → fetch initial             │    │
│  │  2. Navigue vers /tasks/123 → fetch (pas en cache        │    │
│  │     car staleTime=0)                                     │    │
│  │  3. Revient à /tasks → REFRESH AUTOMATIQUE               │    │
│  │                                                           │    │
│  │  ✅ Les données sont toujours fraîches                   │    │
│  │  ✅ L'utilisateur voit l'état réel à chaque navigation   │    │
│  │  ⚠️ Légèrement plus de requêtes réseau                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Compromis accepté :                                             │
│  On privilégie la **cohérence des données** sur la              │
│  **performance réseau**. Dans un gestionnaire de tâches,         │
│  voir des données obsolètes est plus nuisible que               │
│  d'attendre 200ms de plus pour un refetch.                       │
│                                                                  │
│  Note : Les mutations invalident le cache, donc même avec        │
│  staleTime:0, on ne fait pas de fetch inutile pendant que        │
│  les données sont "en train d'être modifiées".                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Système Toast (Sonner)

### 7.1 Qu'est-ce que Sonner ?

Sonner est une bibliothèque de notifications toast pour React. Contrairement aux alertes natives du navigateur (`window.alert()`), les toasts sont non-bloquants, personnalisables et s'intègrent naturellement dans l'interface utilisateur.

### 7.2 Configuration

Le système toast est configuré en deux endroits :

**1. Le wrapper shadcn/ui (`src/components/ui/sonner.tsx`) :**

```tsx
<Sonner
  theme="light"
  className="toaster group"
  toastOptions={{
    classNames: {
      toast: "group-[.toaster]:bg-background group-[.toaster]:text-foreground ...",
      description: "group-[.toast]:text-muted-foreground",
      actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
      cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
    },
  }}
/>
```

Ce wrapper personnalise les classes CSS des toasts pour qu'ils s'intègrent parfaitement avec le système de design shadcn/ui (couleurs sémantiques `bg-background`, `text-foreground`, etc.).

**2. Le placement dans le layout racine (`src/app/layout.tsx`) :**

```tsx
<Toaster richColors closeButton position="bottom-right" />
```

- `richColors` : Active des couleurs vives (vert pour succès, rouge pour erreur, orange pour warning, bleu pour info)
- `closeButton` : Ajoute un bouton × pour fermer manuellement chaque toast
- `position="bottom-right"` : Les toasts apparaissent en bas à droite de l'écran

### 7.3 Schéma d'architecture des toasts

```
┌──────────────────────────────────────────────────────────────────┐
│              ARCHITECTURE DU SYSTÈME TOAST                        │
│                                                                  │
│  ┌── LAYOUT RACINE ───────────────────────────────────────────┐  │
│  │  layout.tsx                                                 │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  QueryProvider                                        │  │  │
│  │  │    └── AuthProvider                                  │  │  │
│  │  │         ├── {children}  ◄── PAGES                    │  │  │
│  │  │         └── <Toaster /> ◄── ÉCOUTE LES TOASTS        │  │  │
│  │  │              position="bottom-right"                  │  │  │
│  │  │              richColors                               │  │  │
│  │  │              closeButton                              │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── SOURCES DES TOASTS ──────────────────────────────────────┐  │
│  │                                                             │  │
│  │  SOURCE 1 : AuthContext (login/logout)                     │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  Login succès :                                       │   │  │
│  │  │    toast.success('Bienvenue, email !', {              │   │  │
│  │  │      description: 'Connecté en tant que USER'          │   │  │
│  │  │    })                                                 │   │  │
│  │  │                                                       │   │  │
│  │  │  Login échec :                                        │   │  │
│  │  │    toast.error('Échec de la connexion', {             │   │  │
│  │  │      description: 'Bad credentials'                    │   │  │
│  │  │    })                                                 │   │  │
│  │  │                                                       │   │  │
│  │  │  Logout :                                             │   │  │
│  │  │    toast.info('Déconnecté', {                          │   │  │
│  │  │      description: 'À bientôt !'                        │   │  │
│  │  │    })                                                 │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                             │  │
│  │  SOURCE 2 : Mutations TanStack Query (CRUD tâches)         │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │  Création succès :                                    │   │  │
│  │  │    toast.success('Tâche créée avec succès')            │   │  │
│  │  │                                                       │   │  │
│  │  │  Mise à jour succès :                                 │   │  │
│  │  │    toast.success('Tâche mise à jour')                  │   │  │
│  │  │                                                       │   │  │
│  │  │  Changement statut :                                   │   │  │
│  │  │    toast.success('Statut mis à jour : DOING')          │   │  │
│  │  │                                                       │   │  │
│  │  │  Suppression succès :                                 │   │  │
│  │  │    toast.success('Tâche supprimée')                    │   │  │
│  │  │                                                       │   │  │
│  │  │  Erreur (toutes mutations) :                           │   │  │
│  │  │    toast.error('Erreur lors de la création', {         │   │  │
│  │  │      description: error.message                        │   │  │
│  │  │    })                                                 │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌── RENDU VISUEL ────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  ✅ Tâche créée avec succès                        × │  │  │
│  │  ├──────────────────────────────────────────────────────┤  │  │
│  │  │  ❌ Erreur lors de la création                  × │  │  │
│  │  │     Network Error                                  │  │  │
│  │  ├──────────────────────────────────────────────────────┤  │  │
│  │  │  ℹ️ Déconnecté                                 × │  │  │
│  │  │     À bientôt !                                      │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                          ↑ position="bottom-right"          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Pourquoi Sonner plutôt que d'autres solutions ?**

- **Zero-config** : Pas besoin de provider complexe, le `<Toaster>` suffit.
- **richColors** : Des couleurs prédéfinies et cohérentes pour chaque type de toast.
- **Auto-dismiss** : Les toasts disparaissent automatiquement après quelques secondes.
- **Pile automatique** : Plusieurs toasts s'empilent proprement sans chevauchement.
- **Type-safe** : `toast.success()`, `toast.error()`, `toast.info()` sont des fonctions typées TypeScript.

---

## 8. Corrections B1–B12

### 8.1 Tableau récapitulatif

```
┌──────────────────────────────────────────────────────────────────┐
│              CORRECTIONS B1–B12 — RÉCAPITULATIF                  │
├─────┬──────────────┬───────────────────┬─────────────────────────┤
│ ID  │ Fichier      │ Problème          │ Correction              │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B1  │ TaskCard.tsx │ Erreur crash si   │ Type guard isApiError() │
│     │              │ error.response    │ au lieu de cast unsafe  │
│     │              │ est undefined     │                         │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B2  │ AuthContext  │ Même pattern de   │ isApiError() dans le    │
│     │ .tsx         │ cast unsafe       │ login() et le logout()  │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B3  │ TasksPage    │ Flash blanc au    │ Skeleton loaders avec   │
│     │ .tsx         │ chargement        │ 6 cartes placeholder    │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B4  │ TaskDetail   │ Flash blanc au    │ Skeleton layout 3       │
│     │ Page.tsx     │ chargement        │ colonnes complet        │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B5  │ LoginForm    │ Pas de loader     │ Spinner Loader2 +       │
│     │ .tsx         │ pendant login     │ bouton désactivé        │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B6  │ TasksPage    │ Toasts manquants  │ useCreateTaskMutation   │
│     │ .tsx         │ après mutation    │ avec onSuccess/onError  │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B7  │ AppLayout    │ Flash blanc       │ Skeleton complet :      │
│     │ .tsx         │ avant auth check  │ navbar + contenu +      │
│     │              │                   │ footer                  │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B8  │ HomePage     │ Flash blanc       │ Skeleton identique au   │
│     │ .tsx         │ initial           │ LoginForm final          │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B9  │ TaskCard.tsx │ Re-rendu inutile  │ React.memo(TaskCard)    │
│     │              │ sur chaque render │ + displayName           │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B10 │ Navbar.tsx   │ Re-rendu inutile  │ React.memo(Navbar)      │
│     │              │ sur chaque render │ + displayName           │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B11 │ TokenTimer   │ Re-rendu chaque   │ React.memo(TokenTimer)  │
│     │ .tsx         │ seconde propage   │ (useEffect interne      │
│     │              │ au parent         │ gère le tick)           │
├─────┼──────────────┼───────────────────┼─────────────────────────┤
│ B12 │ useTasks.ts  │ Aucun toast de   │ Toasts dans chaque       │
│     │              │ feedback CRUD     │ hook mutation           │
└─────┴──────────────┴───────────────────┴─────────────────────────┘
```

### 8.2 Détails de chaque correction

**B1 — Type guard dans TaskCard (Correction critique)**

**Avant :**
```typescript
// ❌ Crash si error.response est undefined
const err = error as { response?: { data?: { message?: string } } };
const msg = err.response?.data?.message || 'Erreur';
```
Ce code faisait un cast TypeScript (`as`) sans aucune vérification runtime. Si l'erreur n'était pas une erreur Axios (par exemple, une erreur réseau `NetworkError`), `error.response` était `undefined` et l'accès à `error.response.data` causait un crash.

**Après :**
```typescript
// ✅ Vérification runtime type-safe
import { isApiError } from '@/types';

if (isApiError(error)) {
  const msg = error.response.data.error || error.response.data.message;
}
```
Le type guard `isApiError` vérifie à l'exécution que l'objet possède bien la structure attendue (`response.data`). TypeScript comprend que dans le bloc `if`, l'erreur a le bon type.

**B2 — Type guard dans AuthContext (Correction critique)**

Même pattern que B1, appliqué aux fonctions `login()` et `logout()` de l'AuthContext. Avant la correction, une erreur réseau non-Axios pouvait crasher l'application lors de la connexion.

**B3–B4, B7–B8 — Élimination des flashs blancs (UX critique)**

Le "flash blanc" est un problème UX courant dans les SPA : pendant que les données chargent, l'écran affiche un contenu vide (fond blanc) pendant 200-500ms, puis le contenu apparaît brusquement. C'est perçu comme un bug par l'utilisateur.

```
┌──────────────────────────────────────────────────────────────────┐
│              FLASH BLANC vs SKELETON LOADING                      │
│                                                                  │
│  AVANT (flash blanc) :          APRÈS (skeleton loading) :       │
│  ┌───────────────────┐          ┌───────────────────┐            │
│  │                   │          │ ░░░░░░░░░░░░░░░░ │            │
│  │   (vide)          │          │ ░░░░░░░░░░░░░░░░ │            │
│  │                   │          │ ░░░░░░░░░░░░░░░░ │            │
│  │                   │  300ms    │ ░░░░░░░░░░░░░░░░ │  300ms     │
│  │                   │  ──────►  │                   │  ──────►   │
│  │                   │          │ ░░░░░░░░░░░░░░░░ │            │
│  │                   │          │ ░░░░░░░░░░░░░░░░ │            │
│  │                   │          └───────────────────┘            │
│  │  ❌ Utilisateur   │          │ ✅ Utilisateur comprend         │
│  │     pense que     │          │    que le contenu charge       │
│  │     c'est cassé   │          │                                   │
│  └───────────────────┘          └───────────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Chaque page a reçu des skeletons qui reproduisent fidèlement la structure du contenu final :

- **HomePage** : Skeleton du LoginForm (card + champs)
- **AppLayout** : Skeleton complet (navbar + grille de contenu + footer)
- **TasksPage** : Grille de 6 cartes skeleton (titre, badge, lignes de texte, boutons)
- **TaskDetailPage** : Layout 3 colonnes en skeleton (colonne principale + latérale)

**B5 — Loader dans LoginForm**

Le bouton de connexion passe d'un texte statique "Se connecter" à un spinner animé + texte "Connexion..." pendant que la requête de login est en cours. Le bouton est aussi désactivé (`disabled`) pour éviter les double-clics.

**B6, B12 — Toasts de feedback CRUD**

Chaque mutation TanStack Query affiche désormais un toast automatique :

- **onSuccess** : `toast.success()` avec un message contextuel ("Tâche créée", "Statut mis à jour : DOING")
- **onError** : `toast.error()` avec le message d'erreur en description

Sans ces corrections, l'utilisateur ne savait pas si son action (créer, modifier, supprimer) avait réussi ou échoué — le comportement silencieux est l'un des pires anti-patterns UX.

**B9–B11 — React.memo pour les composants fréquemment rendus**

```
┌──────────────────────────────────────────────────────────────────┐
│              POURQUOI React.memo SUR CES COMPOSANTS ?             │
│                                                                  │
│  Sans React.memo :                                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Parent (TasksPage) re-render                            │    │
│  │       │                                                   │    │
│  │       ├── TaskCard × 20 → TOUS re-rendus                 │    │
│  │       │   Même si les props (task) n'ont pas changé !    │    │
│  │       │                                                   │    │
│  │       └── Résultat : 20 re-rendus inutiles à chaque      │    │
│  │           interaction (changement de page, toggle form)   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Avec React.memo :                                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Parent (TasksPage) re-render                            │    │
│  │       │                                                   │    │
│  │       ├── TaskCard × 20 → React.memo fait un shallow     │    │
│  │       │   compare des props                               │    │
│  │       │   → Props identiques = PAS de re-render           │    │
│  │       │   → Seul le TaskCard avec des nouvelles props     │    │
│  │       │     est re-rendu                                  │    │
│  │       │                                                   │    │
│  │       └── Résultat : 0-1 re-render au lieu de 20         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Composants optimisés :                                          │
│  • TaskCard  : 20 instances dans la grille de tâches            │
│  • Navbar    : Re-render à chaque navigation                     │
│  • TokenTimer: Se met à jour chaque seconde (setInterval)        │
│                mais ne doit PAS propager le re-render au parent  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. Sécurité

### 9.1 Flux JWT complet

```
┌──────────────────────────────────────────────────────────────────┐
│              SÉCURITÉ JWT — FLUX COMPLET                          │
│                                                                  │
│  1. GÉNÉRATION (Backend)                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Login réussi → JWT généré avec :                        │    │
│  │                                                           │    │
│  │  Header : { "alg": "HS256", "typ": "JWT" }              │    │
│  │  Payload: {                                              │    │
│  │    "sub": "saadoune@tasksphere.com",  ← Subject (email) │    │
│  │    "role": "USER",                       ← Rôle RBAC    │    │
│  │    "iat": 1735000000,                   ← Issued at     │    │
│  │    "exp": 1735003600                    ← Expiration    │    │
│  │  }                                                       │    │
│  │  Signature : HMAC-SHA256(secret_key, header.payload)     │    │
│  │                                                           │    │
│  │  expiresIn: "3600" → 1 heure de validité                │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. STOCKAGE (Frontend)                                         │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  localStorage.setItem('tasksphere_auth', JSON.stringify({│    │
│  │    accessToken, refreshToken, email, role,               │    │
│  │    isAuthenticated, tokenExpiry                          │    │
│  │  }))                                                     │    │
│  │                                                           │    │
│  │  ⚠️ localStorage est accessible par tout JS sur le même   │    │
│  │  domaine. Pas vulnérable au CSRF (pas de cookie), mais   │    │
│  │  vulnérable au XSS si du JS non fiable est injecté.      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. VALIDATION (Backend - chaque requête)                       │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Spring Security JWT Filter :                             │    │
│  │                                                           │    │
│  │  1. Extrait le header Authorization                       │    │
│  │  2. Vérifie le format "Bearer <token>"                   │    │
│  │  3. Valide la signature HMAC-SHA256                      │    │
│  │  4. Vérifie l'expiration (exp > now)                     │    │
│  │  5. Extrait le subject (userId) et le rôle               │    │
│  │  6. Charge le SecurityContext Spring                      │    │
│  │                                                           │    │
│  │  Si une étape échoue → 401 Unauthorized                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  4. REFRESH (token expiré)                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Access Token expiré → 401 → Axios interceptor           │    │
│  │  → POST /auth/refresh avec refreshToken                  │    │
│  │  → Backend valide le refreshToken                       │    │
│  │  → Nouveau pair (accessToken + refreshToken) retourné   │    │
│  │  → Ancien refreshToken invalidé (rotation)               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 Stockage des tokens

Le choix de stockage a des implications de sécurité importantes :

```
┌──────────────────────────────────────────────────────────────────┐
│              COMPARAISON DES STOCKAGES DE TOKEN                   │
│                                                                  │
│  ┌───────────────────┬────────────────┬──────────────────────┐  │
│  │ Méthode           │ CSRF           │ XSS                   │  │
│  ├───────────────────┼────────────────┼──────────────────────┤  │
│  │ Cookies (httpOnly)│ ❌ Vulnérable  │ ✅ Protégé            │  │
│  │                   │ (envoyé auto)  │ (JS ne peut pas lire)│  │
│  ├───────────────────┼────────────────┼──────────────────────┤  │
│  │ localStorage      │ ✅ Protégé     │ ❌ Vulnérable         │  │
│  │ (choix TaskSphere)│ (pas de cookie)│ (JS peut tout lire)  │  │
│  ├───────────────────┼────────────────┼──────────────────────┤  │
│  │ sessionStorage    │ ✅ Protégé     │ ❌ Vulnérable         │  │
│  │                   │ (pas de cookie)│                       │  │
│  │                   │ + auto-clean   │                       │  │
│  │                   │ à la fermeture │                       │  │
│  └───────────────────┴────────────────┴──────────────────────┘  │
│                                                                  │
│  TaskSphere utilise localStorage car :                            │
│  • Les requêtes API sont manuelles (pas de cookie auto-envoyé)   │
│  • On contrôle précisément quand et comment le token est envoyé   │
│  • Le refresh automatique nécessite un accès JS au token          │
│  • Les headers Bearer sont le standard REST                      │
│                                                                  │
│  Atténuation XSS :                                               │
│  • React échappe automatiquement le contenu JSX                  │
│  • Pas de dangerouslySetInnerHTML dans le projet                  │
│  • CSP (Content Security Policy) recommandée en production       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.3 Ownership RBAC

Le contrôle d'accès de TaskSphere combine deux mécanismes :

```
┌──────────────────────────────────────────────────────────────────┐
│              MODÈLE DE SÉCURITÉ : OWNERSHIP + RBAC               │
│                                                                  │
│  1. RBAC (Role-Based Access Control)                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                           │    │
│  │  ┌──────────┐   Accès API    ┌──────────────────────┐   │    │
│  │  │ USER     │───────────────►│ GET /tasks (ses       │   │    │
│  │  │          │               │  tâches uniquement)   │   │    │
│  │  │          │               │ POST /tasks            │   │    │
│  │  │          │               │ PUT/DELETE /tasks/{id} │   │    │
│  │  │          │               │   (ses tâches seul.)   │   │    │
│  │  └──────────┘               └──────────────────────┘   │    │
│  │                                                           │    │
│  │  ┌──────────┐   Accès API    ┌──────────────────────┐   │    │
│  │  │ MANAGER  │───────────────►│ Même que USER         │   │    │
│  │  │          │               │ + futures features    │   │    │
│  │  │          │               │ (gestion d'équipe)    │   │    │
│  │  └──────────┘               └──────────────────────┘   │    │
│  │                                                           │    │
│  │  ┌──────────┐   Accès API    ┌──────────────────────┐   │    │
│  │  │ ADMIN    │───────────────►│ Toutes les opérations │   │    │
│  │  │          │               │ + /h2-console          │   │    │
│  │  │          │               │ + futures features     │   │    │
│  │  │          │               │ (admin panel)          │   │    │
│  │  └──────────┘               └──────────────────────┘   │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. OWNERSHIP (vérification par tâche)                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                                                           │    │
│  │  Pour chaque opération sur /tasks/{id} :                 │    │
│  │                                                           │    │
│  │  ┌──────────┐    GET /tasks/abc     ┌────────────────┐   │    │
│  │  │ Frontend │──────────────────────►│  Backend       │   │    │
│  │  │          │ Bearer eyJ...         │                │   │    │
│  │  │ saadoune │                      │  JWT Filter :  │   │    │
│  │  │          │                      │  userId = "u1" │   │    │
│  │  └──────────┘                      │                │   │    │
│  │                                    │  TaskService : │   │    │
│  │                                    │  task.userId   │   │    │
│  │                                    │  = "u2"        │   │    │
│  │                                    │                │   │    │
│  │                                    │  u1 ≠ u2       │   │    │
│  │                                    │  ──────────    │   │    │
│  │                                    │  ❌ 404 Not    │   │    │
│  │                                    │  Found          │   │    │
│  │                                    │  (pas 403 !)   │   │    │
│  │                                    └────────────────┘   │    │
│  │                                                           │    │
│  │  Le backend retourne 404 (et non 403) pour ne pas       │    │
│  │  révéler l'existence de la tâche (information leakage).  │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Page de test (/ownership) :                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  La page /ownership automatise 8 tests pour vérifier :   │    │
│  │                                                           │    │
│  │  1. ✅ Création de tâche (POST /tasks)                   │    │
│  │  2. ✅ Liste mes tâches (GET /tasks)                     │    │
│  │  3. ✅ Accès à MA tâche (GET /tasks/{id})               │    │
│  │  4. ✅ Mise à jour de MA tâche (PUT)                     │    │
│  │  5. ✅ Changement de statut (PATCH)                      │    │
│  │  6. ✅ Soft delete de MA tâche (DELETE)                  │    │
│  │  7. ✅ 404 pour tâche inexistante                        │    │
│  │  8. ✅ Vérification JWT (email + rôle)                   │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 9.4 Prévention XSS

React fournit une protection XSS intégrée :

```
┌──────────────────────────────────────────────────────────────────┐
│              PRÉVENTION XSS DANS TASKSPHERE                       │
│                                                                  │
│  ✅ React échappe automatiquement :                              │
│     <p>{task.title}</p>  →  Si title = "<script>alert(1)</script>"│
│     Rendu : &lt;script&gt;alert(1)&lt;/script&gt;               │
│     → Le script n'est PAS exécuté                               │
│                                                                  │
│  ✅ Pas de dangerouslySetInnerHTML dans le projet                 │
│     → Aucun point d'injection HTML direct                        │
│                                                                  │
│  ✅ Pas d'eval(), new Function(), ou innerHTML                    │
│                                                                  │
│  ✅ La seule exception : décodage JWT (base64)                   │
│     const payload = JSON.parse(atob(token.split('.')[1]));       │
│     → atob() décode du base64, pas du HTML                       │
│     → JSON.parse() analyse du JSON, pas du HTML                  │
│     → Pas de risque XSS                                          │
│                                                                  │
│  ⚠️ Recommandations pour la production :                         │
│     • CSP headers (Content-Security-Policy) via next.config.js   │
│     • Helmet middleware pour les headers de sécurité              │
│     • Audit régulier avec npm audit                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Guide de démarrage

### 10.1 Prérequis

```
┌──────────────────────────────────────────────────────────────────┐
│              PRÉREQUIS                                            │
│                                                                  │
│  • Node.js ≥ 18.x (recommandé : 20.x LTS)                       │
│  • npm ≥ 9.x (inclus avec Node.js)                               │
│  • Java 17+ (pour le backend Spring Boot)                        │
│  • Maven (pour le backend)                                       │
│  • Un terminal (bash, zsh, PowerShell)                            │
│  • Un éditeur de code (VS Code recommandé)                       │
│                                                                  │
│  Vérification :                                                  │
│  $ node --version    → v20.x.x                                   │
│  $ npm --version     → 10.x.x                                    │
│  $ java --version    → 17.x.x ou supérieur                      │
│  $ mvn --version     → Apache Maven 3.x                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.2 Installation

```bash
# 1. Cloner le projet (ou naviguer vers le répertoire)
cd /home/z/my-project/TaskSphere-Frontend

# 2. Installer les dépendances
npm install

# 3. Vérifier l'installation
npm run lint  # Devrait passer sans erreur
```

### 10.3 Lancement

```
┌──────────────────────────────────────────────────────────────────┐
│              LANCEMENT DE L'APPLICATION                           │
│                                                                  │
│  Terminal 1 — Backend (Spring Boot) :                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  $ cd /chemin/vers/tasksphere-backend                     │    │
│  │  $ mvn spring-boot:run                                    │    │
│  │                                                           │    │
│  │  ... Started TaskSphereApplication in X.XX seconds        │    │
│  │  ... Tomcat started on port(s): 8080 (http)              │    │
│  │                                                           │    │
│  │  ✅ Backend disponible sur http://localhost:8080          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Terminal 2 — Frontend (Next.js) :                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  $ cd /home/z/my-project/TaskSphere-Frontend             │    │
│  │  $ npm run dev                                            │    │
│  │                                                           │    │
│  │  > tasksphere-frontend@1.1.0 dev                         │    │
│  │  > next dev -p 3000                                      │    │
│  │                                                           │    │
│  │    ▲ Next.js 14.2.21                                     │    │
│  │    - Local:    http://localhost:3000                     │    │
│  │    - Network:  http://192.168.x.x:3000                   │    │
│  │                                                           │    │
│  │  ✅ Frontend disponible sur http://localhost:3000         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.4 Comptes de test

```
┌──────────────────────────────────────────────────────────────────┐
│              COMPTES DE TEST                                      │
│                                                                  │
│  ┌─────────────────────────┬──────────┬──────────┬────────────┐  │
│  │ Email                   │ Mot de   │ Rôle     │ Usage      │  │
│  │                         │ passe    │          │            │  │
│  ├─────────────────────────┼──────────┼──────────┼────────────┤  │
│  │ saadoune@tasksphere.com │ password │ USER     │ Utilisateur│  │
│  │                         │ 123      │          │ standard   │  │
│  ├─────────────────────────┼──────────┼──────────┼────────────┤  │
│  │ manager@tasksphere.com  │ password │ MANAGER  │ Gestion    │  │
│  │                         │ 123      │          │ d'équipe   │  │
│  ├─────────────────────────┼──────────┼──────────┼────────────┤  │
│  │ admin@tasksphere.com    │ password │ ADMIN    │ Super      │  │
│  │                         │ 123      │          │ admin      │  │
│  └─────────────────────────┴──────────┴──────────┴────────────┘  │
│                                                                  │
│  Accès rapide : La page de connexion propose des boutons         │
│  "USER", "MANAGER", "ADMIN" qui pré-remplissent le formulaire.  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.5 URLs utiles

```
┌──────────────────────────────────────────────────────────────────┐
│              URLs UTILES                                          │
│                                                                  │
│  • Application     : http://localhost:3000                       │
│  • Page de login   : http://localhost:3000/                      │
│  • Liste de tâches : http://localhost:3000/tasks                  │
│  • Test ownership  : http://localhost:3000/ownership              │
│  • Console H2      : http://localhost:8080/h2-console            │
│    (JDBC URL: jdbc:h2:mem:tasksphere | ADMIN requis)            │
│  • API Backend     : http://localhost:8080/api/v1/               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 10.6 Commandes npm

```
┌──────────────────────────────────────────────────────────────────┐
│              COMMANDES NPM                                        │
│                                                                  │
│  npm run dev     Démarre le serveur de développement (port 3000) │
│  npm run build   Compile l'application pour la production        │
│  npm run start   Lance l'application compilée (port 3000)       │
│  npm run lint    Vérifie la qualité du code (ESLint)             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Annexe : Diagramme récapitulatif global

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE GLOBALE TASKSPHERE                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        NAVIGATEUR (Browser)                             │  │
│  │                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Next.js (port 3000)                             │  │  │
│  │  │                                                                   │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │  │  │
│  │  │  │  QueryProvider  →  AuthProvider  →  Pages + Components       │ │  │  │
│  │  │  │  (TanStack Q)     (JWT, login,    (AppRouter, shadcn/ui,     │ │  │  │
│  │  │  │                   logout, ctx)    Sonner toasts, React.memo)  │ │  │  │
│  │  │  └─────────────────────────────────────────────────────────────┘ │  │  │
│  │  │                              │                                    │  │  │
│  │  │  ┌───────────────────────────▼────────────────────────────────┐  │  │  │
│  │  │  │  Client Axios (src/lib/api.ts)                              │  │  │  │
│  │  │  │  • baseURL: '/api/v1'                                       │  │  │  │
│  │  │  │  • Request Interceptor: injecte Bearer token                 │  │  │  │
│  │  │  │  • Response Interceptor: auto-refresh si 401                 │  │  │  │
│  │  │  │  • failedQueue: évite les refreshs simultanés                │  │  │  │
│  │  │  └────────────────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                        │  │
│  │                         ┌────▼────┐                                   │  │
│  │                         │ Rewrite │                                   │  │
│  │                         │ /api/*  │                                   │  │
│  │                         │ → :8080 │                                   │  │
│  │                         └────┬────┘                                   │  │
│  └──────────────────────────────┼────────────────────────────────────────┘  │
│                                 │ HTTP (same-origin pour le navigateur)     │
│  ┌──────────────────────────────┼────────────────────────────────────────┐  │
│  │                    Spring Boot (port 8080)                             │  │
│  │                              │                                         │  │
│  │  ┌───────────────────────────▼─────────────────────────────────────┐  │  │
│  │  │  Spring Security JWT Filter                                    │  │  │
│  │  │  • Valide signature → Extrait userId/role → SecurityContext     │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                              │                                         │  │
│  │         ┌────────────────────┼────────────────────┐                   │  │
│  │         │                    │                    │                   │  │
│  │  ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐             │  │
│  │  │ IAM Module  │     │ Core Module │     │ Global      │             │  │
│  │  │             │     │             │     │ Exception   │             │  │
│  │  │ Auth        │     │ Task        │     │ Handler     │             │  │
│  │  │ Controller  │     │ Controller  │     │             │             │  │
│  │  │             │     │             │     │ { timestamp │             │  │
│  │  │ /auth/login │     │ /tasks      │     │   status    │             │  │
│  │  │ /auth/      │     │ /tasks/{id} │     │   error     │             │  │
│  │  │  refresh    │     │ /tasks/{id} │     │   message   │             │  │
│  │  │ /auth/logout│     │  /status    │     │   path }    │             │  │
│  │  └──────┬──────┘     └──────┬──────┘     └─────────────┘             │  │
│  │         │                   │                                         │  │
│  │  ┌──────▼───────────────────▼──────┐                                 │  │
│  │  │    Hibernate/JPA + H2 Database  │                                 │  │
│  │  │                                │                                 │  │
│  │  │  users  ◄────FK────  tasks     │                                 │  │
│  │  │  (email, role,       (title,   │                                 │  │
│  │  │   password)          status,   │                                 │  │
│  │  │                      priority, │                                 │  │
│  │  │                      userId)   │                                 │  │
│  │  └────────────────────────────────┘                                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

*Document généré pour le projet TaskSphere Frontend v1.1.0 — Sprint 2.*
*Tous les diagrammes sont en ASCII art pour une lisibilité maximale dans tout éditeur de texte.*
