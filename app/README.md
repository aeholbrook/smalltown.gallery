# Small Town Gallery

Small Town Gallery is the current web app for the Small Town Documentary archive at SIU.

## Current Status

- Production app is active on `master`.
- Core flows are live: public map, town/year galleries, photographer pages, dashboard, admin.
- Storage is on Cloudflare R2 (not Vercel Blob).
- Town landing pages now include Wikipedia summary content when available.
- Map popups include a direct `View Town Overview` action.
- Large photo uploads are handled with direct browser-to-R2 upload + client-side resize fallback.

## Stack

- Next.js 16 + App Router
- TypeScript
- Prisma + PostgreSQL (local or Neon)
- NextAuth v5
- Cloudflare R2 (S3 API)
- Mapbox GL + PhotoSwipe

## Local Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

For full environment setup, see `GETTING_STARTED.md`.

## Docs

- `GETTING_STARTED.md`: local setup and day-to-day commands
- `ARCHITECTURE.md`: routing, data model, and request flows
- `MARKDOWN_FEATURES.md`: markdown usage guidelines for editors/photographers
- `README.nextjs.md`: upstream Next.js starter reference (kept for baseline)
