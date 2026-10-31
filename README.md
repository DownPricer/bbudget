# Bbudget

Application web de budget personnel (PWA iPhone) — douce, en français, sans culpabilité.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Auth.js (Credentials + bcrypt)
- Framer Motion
- Déploiement : Docker Compose + Caddy (HTTPS)

## Installer & lancer en local

Prérequis : Node.js 20+, Docker (pour PostgreSQL).

```bash
npm install
cp .env.example .env
# Éditer .env : au minimum AUTH_SECRET (openssl rand -base64 32)
docker compose -f docker-compose.dev.yml up -d
npm run db:push
npm run db:seed
npm run icons   # génère les icônes PWA
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) (ou le port défini dans `.env` / `PORT`).

### Compte de démo (seed)

Après `npm run db:seed` :

- e-mail : `demo@bbudget.app`
- mot de passe : `demo1234`

Ces valeurs sont **factices**, destinées au développement local uniquement.

### Créer ton propre compte

Il n’y a pas d’inscription publique (`ALLOW_SIGNUP=false`). Crée un utilisateur ainsi :

```bash
npm run create-user -- toi@mail.com MotDePasse1 Prénom
```

Puis connecte-toi sur `/connexion`.

## Tests

```bash
npm test                 # unitaires (Vitest)
npx tsc --noEmit         # types
npm run lint             # ESLint
```

E2E (Playwright, base `bbudget_e2e` séparée) :

```bash
npm run test:e2e:prepare
npx next build
npm run test:e2e
```

## Déploiement (Docker + Caddy)

1. Sur le VPS, clone le dépôt et crée un `.env` **jamais commité** :

```env
POSTGRES_USER=bbudget
POSTGRES_PASSWORD=un-mot-de-passe-fort
POSTGRES_DB=bbudget
AUTH_SECRET=genere-avec-openssl-rand-base64-32
AUTH_URL=https://budget.ton-domaine.fr
DOMAIN=budget.ton-domaine.fr
ALLOW_SIGNUP=false
ALLOW_SEED=false
```

2. Lancer :

```bash
docker compose up -d --build
```

3. Créer le compte admin :

```bash
docker compose exec app npx tsx scripts/create-user.ts toi@mail.com MotDePasse1 Prénom
```

4. Mise à jour :

```bash
git pull
docker compose up -d --build
```

5. Sauvegarde quotidienne (cron) :

```bash
chmod +x scripts/backup-db.sh
# 0 3 * * * cd /opt/bbudget && ./scripts/backup-db.sh
```

Caddy obtient automatiquement le certificat HTTPS pour `$DOMAIN` (ports 80/443 ouverts).

## Fonctionnalités

- Solde de compte + « Tu peux dépenser » (plafonné par le solde et les enveloppes)
- Ajout / édition rapide (dépenses, rentrées, enveloppes)
- Abonnements, dettes & épargne, coups de cœur
- Onboarding, bilan, astuces & défis, réglages, export CSV
- PWA iPhone (manifest, SW, safe areas)

## Sécurité

- Ne committe jamais `.env`, `.env.e2e` ni de vrais secrets
- En production : `ALLOW_SEED=false`, mot de passe Postgres et `AUTH_SECRET` uniques
