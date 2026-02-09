# Getting Started - Small Town Gallery

Welcome! This guide will help you get the development environment running.

## Current Status

✅ **Completed:**
- Next.js 15 project initialized with TypeScript and Tailwind
- Prisma database schema designed (User, Town, Project, Photo models)
- Markdown support infrastructure (components + utilities)
- Project structure and configuration
- NPM dependencies installed

❌ **Not Yet Built:**
- Database connection (needs environment variables)
- Authentication system (NextAuth.js configured but not implemented)
- UI components (homepage, galleries, upload, etc.)
- Map integration (Mapbox)
- API routes

## Quick Start

### 1. Install Dependencies (already done)
```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the `app/` directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add:

```env
# Database (will set up later with Vercel)
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob (will get from Vercel dashboard)
BLOB_READ_WRITE_TOKEN=""

# Mapbox (get free token at https://mapbox.com)
NEXT_PUBLIC_MAPBOX_TOKEN=""
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 (or use PORT=3001 for different port)

## Project Structure

```
app/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage (default Next.js starter)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   └── ui/                # Reusable components
│       ├── markdown-editor.tsx
│       └── markdown-renderer.tsx
├── lib/
│   ├── db.ts              # Prisma client
│   ├── utils.ts           # Helper functions
│   ├── markdown.ts        # Markdown utilities
│   └── auth.config.ts     # NextAuth config
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static files
└── README.md              # Main documentation
```

## Database Schema Overview

### Models:
- **User**: Photographer accounts with roles (PENDING, PHOTOGRAPHER, ADMIN)
- **Town**: Geographic locations with coordinates and markdown descriptions
- **Project**: Links User + Town + Year (unique per combination)
- **Photo**: Images with markdown captions, EXIF data, Blob storage URLs

### Key Relationships:
- One Town → Many Projects
- One User → Many Projects
- One Project → Many Photos

## Next Steps to Build

### Phase 1: Authentication
1. Complete NextAuth.js setup
2. Create login/register pages
3. Build user approval flow for admins

### Phase 2: Core UI
1. Homepage with map
2. Town gallery pages
3. Photographer dashboard
4. Admin panel

### Phase 3: Upload System
1. Drag-and-drop photo upload
2. Direct-to-Blob upload flow
3. EXIF extraction
4. Markdown caption editor

### Phase 4: Gallery
1. PhotoSwipe lightbox
2. Year filtering
3. Multi-photographer views
4. Responsive grid

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Create migration
npx prisma studio        # Open Prisma GUI
npx prisma db push       # Push schema changes (dev only)

# Code Quality
npm run lint             # Run ESLint
```

## VSCode Extensions Recommended

- **Prisma** (prisma.prisma)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)

## Troubleshooting

### Port already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Prisma errors
```bash
# Regenerate client
npx prisma generate

# Reset database (dev only!)
npx prisma migrate reset
```

### Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Documentation

- **README.md** - Project overview and setup
- **ARCHITECTURE.md** - Technical architecture details
- **MARKDOWN_FEATURES.md** - Guide for photographers using markdown
- **GETTING_STARTED.md** - This file!

## Git Branch

You're currently on the `rebuild` branch. The old PHP version is preserved in:
- `/old-php-version/` - Original PHP application
- `/towns/` - Original photo data (to be migrated)

## Need Help?

Check the docs above or review:
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
- Tailwind docs: https://tailwindcss.com/docs

---

Happy coding! 🎨📸
