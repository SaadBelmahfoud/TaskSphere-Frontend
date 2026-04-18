# TaskSphere-Frontend

Frontend Next.js pour le projet TaskSphere-Platform (Sprint 1).

## Prérequis

- **Node.js** >= 18
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

## Architecture

```
src/
├── app/
│   ├── page.tsx          # Page de connexion (login)
│   ├── tasks/
│   │   ├── page.tsx      # Liste des tâches + création
│   │   └── [id]/
│   │       └── page.tsx  # Détail/édition d'une tâche
│   └── ownership/
│       └── page.tsx      # Page de test d'ownership
├── components/
│   ├── AppLayout.tsx      # Layout protégé (navbar + footer)
│   ├── Navbar.tsx         # Barre de navigation
│   ├── LoginForm.tsx      # Formulaire de connexion
│   ├── TaskCard.tsx       # Carte de tâche (liste)
│   ├── TaskForm.tsx       # Formulaire création/édition
│   ├── ConfirmDialog.tsx  # Dialogue de confirmation
│   └── TokenTimer.tsx     # Compteur de temps restant du token
├── context/
│   └── AuthContext.tsx     # Auth state + login/logout + auto-refresh
├── hooks/
│   └── useTasks.ts        # Fonctions CRUD tâches
├── lib/
│   └── api.ts             # Client Axios + intercepteur JWT
└── types/
    └── index.ts           # Types TypeScript
```

## Fonctionnalités

- **Authentification JWT** avec auto-refresh transparent
- **CRUD complet** des tâches (créer, lister, voir, modifier, supprimer)
- **Gestion des statuts** (TODO → DOING → DONE)
- **Priorités** (LOW, MEDIUM, HIGH, CRITICAL)
- **Pagination** côté serveur
- **Ownership** : chaque utilisateur ne voit que ses tâches
- **Page de test d'ownership** automatisée
- **Token timer** visible dans la navbar
- **Soft delete** (archivage)

## Utilisateurs de test

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| saadoune@tasksphere.com | password123 | USER |
| manager@tasksphere.com | password123 | MANAGER |
| admin@tasksphere.com | password123 | ADMIN |

## API Proxy

Le fichier `next.config.js` configure un proxy qui redirige les requêtes `/api/*` vers `localhost:8080`. Le CORS doit être configuré côté backend.

## Modification Backend requise

Deux fichiers doivent être modifiés dans le backend :

1. **`tasksphere-core/pom.xml`** : Ajouter la dépendance springdoc-openapi
2. **`SecurityConfig.java`** : Ajouter la configuration CORS pour `localhost:3000`
