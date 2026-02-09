# Small Town Gallery - Rebuild

A modern photo gallery platform for documenting small towns in Southern Illinois, part of Professor Dan Overturf's Small Town Documentary class at Southern Illinois University.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **File Storage**: Vercel Blob Storage
- **Maps**: Mapbox GL JS
- **Gallery**: PhotoSwipe v5
- **Deployment**: Vercel

## Architecture

### Database Models
- **User**: Photographers and admins with role-based access
- **Town**: Geographic locations with coordinates
- **Project**: A photographer's work in a specific town/year
- **Photo**: Individual images with metadata

### User Roles
- **PENDING**: Awaiting admin approval
- **PHOTOGRAPHER**: Can upload to own projects
- **ADMIN**: Full management access

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy to Vercel - it will auto-detect Next.js configuration.
