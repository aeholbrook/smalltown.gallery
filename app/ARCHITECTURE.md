# Architecture

## Current System Shape

The active application lives in `app/` as a Next.js App Router project.

Primary capabilities:

- Public browsing: map, town landing pages, year galleries, photographer pages
- Auth flows: login, register, password reset
- Photographer dashboard: project management and uploads
- Admin area: users, projects, placeholders
- Media storage: Cloudflare R2
- Data: PostgreSQL via Prisma

## Runtime Stack

- Next.js 16 (server components + route handlers)
- NextAuth v5
- Prisma ORM
- PostgreSQL (Neon in production)
- Cloudflare R2 (S3-compatible)

## Core Data Model

- `User`: auth identity + role + profile fields
- `Town`: canonical town metadata and coordinates
- `Project`: town/year/photographer grouping
- `Photo`: file reference, dimensions, ordering, caption metadata

Important constraint:

- Unique project per `(townId, year, userId)`

## Route Layout (Current)

- Public:
  - `/`
  - `/towns/[town]`
  - `/towns/[town]/[year]`
  - `/photographers/[slug]`
  - `/about`
- Auth:
  - `/login`
  - `/register`
  - `/reset-password`
- Dashboard:
  - `/dashboard`
  - `/dashboard/new`
  - `/dashboard/projects/[id]`
  - `/dashboard/profile`
- Admin:
  - `/admin`
  - `/admin/users`
  - `/admin/projects`
  - `/admin/placeholders`

## Upload Flow (Current)

1. Client prepares file metadata.
2. Client requests signed upload URL from `/api/upload/r2/sign`.
3. Browser uploads file directly to R2 with `PUT`.
4. Client submits photo metadata to `/api/upload`.
5. Server writes `Photo` rows and updates `Project.photoCount`.

Fallback route `/api/upload/r2` still exists for environments where direct upload fails.

## Town Content Flow

- Town/year gallery data is DB-driven (`published` projects).
- Town landing pages pull:
  - Gallery options/previews from DB
  - Wikipedia context from API URL map + fallback query logic
