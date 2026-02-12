# Getting Started

This guide is for running and working on the current app in `app/`.

## Current Status Snapshot

As of February 2026:

- Next.js app is the primary system.
- Legacy filesystem/PHP assets were moved out of this repo root to `/opt/smalltown.gallery-legacy`.
- Photo uploads use Cloudflare R2.
- Town pages are under `/towns/[town]` and `/towns/[town]/[year]`.
- Wikipedia enrichment is wired into town landing pages.

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (local) or Neon connection string

## 1. Install

```bash
npm install
```

## 2. Environment

Create `.env.local` (or use `.env` in local dev):

```bash
cp .env.example .env.local
```

Minimum variables you need:

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."

# Map
NEXT_PUBLIC_MAPBOX_TOKEN="..."

# R2
R2_ACCOUNT_ID="..."
R2_BUCKET="..."
R2_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_PUBLIC_BASE_URL="https://photos.smalltown.gallery"
```

## 3. Prisma Client

```bash
npx prisma generate
```

## 4. Start Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npx prisma studio
```

## Database Notes

- Local and remote data can diverge quickly during imports/cleanup.
- If you sync local from Neon, verify counts after clone (users/towns/projects/photos).
- Canonical source for production is Neon + `master` deploys.

## Upload Notes

- Direct browser `PUT` to R2 is the preferred path.
- Ensure R2 bucket CORS allows your site origin and `PUT`.
- Server upload fallback can still hit platform request body limits.

## Troubleshooting

- `Request Entity Too Large`: direct R2 path failed and fallback path hit body limit. Check R2 CORS.
- Missing town page content: verify published project rows and slug matching.
- Local page differs from prod: confirm which `DATABASE_URL` your process is using.
