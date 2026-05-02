# ═══════════════════════════════════════════════════════════════════
# Dockerfile — PHASE 2 — TÂCHE 5 : DevOps (Pin base images)
# ═══════════════════════════════════════════════════════════════════
#
# PRINCIPE : Multi-stage build avec images de base épinglées (pinned)
#
# POURQUOI PINNER LES IMAGES ?
# ────────────────────────────
# En utilisant des tags spécifiques (ex: 22-alpine au lieu de latest),
# on garantit des builds REPRODUCTIBLES. Si on utilise :latest,
# une mise à jour de l'image de base peut casser le build.
#
# POURQUOI MULTI-STAGE ?
# ──────────────────────
# Stage 1 (deps)  : Installe TOUTES les dépendances (y compris devDeps)
# Stage 2 (build) : Build l'application Next.js
# Stage 3 (run)   : Copie SEULEMENT le nécessaire pour l'exécution
#                    → Image finale MINIMALE (pas de devDeps, pas de .next/cache)
#
# OPTIMISATIONS :
# 1. Bun alpine → Image de base légère (~100MB vs ~1GB node:latest)
# 2. standalone output → Next.js génère un serveur autonome
# 3. .dockerignore → Exclut les fichiers inutiles du contexte de build
# 4. Layer caching → COPY package.json AVANT le code source
#    → Si seul le code change, les dépendances sont en cache
# ═══════════════════════════════════════════════════════════════════

# ── Stage 1 : Install dependencies ──
# Image épinglée : oven/bun:1.2.16-alpine (pas :latest)
# Alpine = distribution Linux minimale (~5MB vs ~50MB Debian)
FROM oven/bun:1.2.16-alpine AS deps

WORKDIR /app

# Copier SEULEMENT les fichiers de dépendances en premier
# → Cache Docker : si package.json ne change pas, ce layer est réutilisé
COPY package.json bun.lock ./

# Installer TOUTES les dépendances (prod + dev)
# bun install est ~3x plus rapide que npm install
RUN bun install --frozen-lockfile

# ── Stage 2 : Build application ──
FROM oven/bun:1.2.16-alpine AS builder

WORKDIR /app

# Copier les dépendances installées
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Build Next.js en mode standalone
# standalone génère un serveur autonome dans .next/standalone/
# qui ne nécessite PAS node_modules complet
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ── Stage 3 : Production image ──
# Image épinglée : oven/bun:1.2.16-alpine (même version que le builder)
FROM oven/bun:1.2.16-alpine AS runner

WORKDIR /app

# Variables d'environnement de production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Créer un utilisateur non-root pour la sécurité
# root inside container = root on host → security risk
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier le build standalone (SERVEUR + FICHIERS STATIQUES)
# standalone contient TOUT le nécessaire pour l'exécution
COPY --from=builder /app/.next/standalone ./

# Copier les fichiers statiques (CSS, JS, images)
# Ils ne sont PAS inclus dans le standalone
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Changer le propriétaire des fichiers
RUN chown -R nextjs:nodejs /app

# Utiliser l'utilisateur non-root
USER nextjs

# Exposer le port 3000
EXPOSE 3000

# Port par défaut de Next.js standalone
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Démarrer le serveur standalone
# server.js est généré par next build avec output: 'standalone'
CMD ["bun", "server.js"]
