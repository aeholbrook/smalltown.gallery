# Small Town Gallery - Architecture Documentation

## System Overview

The Small Town Gallery is a full-stack web application for managing and displaying documentary photography projects of small towns in Southern Illinois. It features an invite-only user system, role-based access control, and an interactive map interface.

## Technology Stack

### Frontend
- **Next.js 15** (App Router): React framework with server components
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Mapbox GL JS**: Interactive map visualization
- **PhotoSwipe v5**: Touch-friendly gallery lightbox
- **Radix UI**: Accessible component primitives

### Backend
- **Next.js API Routes**: RESTful API endpoints
- **Next.js Server Actions**: Server-side mutations
- **NextAuth.js v5**: Authentication and session management
- **Prisma ORM**: Type-safe database queries
- **PostgreSQL**: Relational database (via Vercel Postgres)

### Infrastructure
- **Vercel**: Hosting and deployment platform
- **Vercel Postgres**: Managed PostgreSQL database
- **Vercel Blob Storage**: Object storage for images
- **GitHub**: Version control and CI/CD

## Database Schema

### Core Models

#### User
```prisma
id            String    (CUID)
email         String    (unique)
name          String
passwordHash  String
role          Role      (PENDING | PHOTOGRAPHER | ADMIN)
inviteCode    String?   (unique)
invitedBy     String?
emailVerified DateTime?
createdAt     DateTime
updatedAt     DateTime
```

**Relationships:**
- Has many Projects
- Has many Photos
- Has many Accounts (NextAuth)
- Has many Sessions (NextAuth)

#### Town
```prisma
id          String  (CUID)
name        String  (unique)
state       String  (default: "Illinois")
latitude    Float
longitude   Float
description String?
population  Int?
createdAt   DateTime
updatedAt   DateTime
```

**Relationships:**
- Has many Projects

#### Project
```prisma
id              String  (CUID)
townId          String
year            Int
photographer    String
description     String?
userId          String
published       Boolean (default: false)
featuredPhotoId String?
photoCount      Int     (default: 0)
createdAt       DateTime
updatedAt       DateTime
```

**Relationships:**
- Belongs to Town
- Belongs to User
- Has many Photos

**Unique Constraint:** `[townId, year, userId]` - One project per user/town/year

#### Photo
```prisma
id          String  (CUID)
projectId   String
userId      String
filename    String
title       String?
caption     String?
blobUrl     String
pathname    String
width       Int
height      Int
size        Int
order       Int     (default: 0)
exifData    Json?
uploadedAt  DateTime
```

**Relationships:**
- Belongs to Project
- Belongs to User

## Application Structure

### Route Groups

```
app/
├── (public)/           # Public pages (no auth required)
│   ├── page.tsx        # Homepage with interactive map
│   ├── towns/
│   │   └── [town]/
│   │       └── [year]/
│   │           └── page.tsx  # Gallery view (SSG)
│   └── about/
│       └── page.tsx    # About page
│
├── (auth)/             # Authentication pages
│   ├── login/
│   │   └── page.tsx    # Login form
│   └── register/
│       └── page.tsx    # Registration form
│
├── dashboard/          # Photographer dashboard (auth required)
│   ├── page.tsx        # Project list
│   ├── projects/
│   │   ├── new/
│   │   │   └── page.tsx      # Create project
│   │   └── [id]/
│   │       ├── page.tsx      # Edit project
│   │       └── upload/
│   │           └── page.tsx  # Upload photos
│   └── settings/
│       └── page.tsx    # User settings
│
└── admin/              # Admin panel (admin only)
    ├── page.tsx        # Admin dashboard
    ├── users/
    │   └── page.tsx    # User management
    └── towns/
        └── page.tsx    # Town management
```

### Component Structure

```
components/
├── ui/                 # Reusable UI primitives
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── dropdown.tsx
│   ├── input.tsx
│   └── ...
│
├── map/                # Map-related components
│   ├── InteractiveMap.tsx    # Main map component
│   ├── TownMarker.tsx        # Map markers
│   └── MapPopup.tsx          # Info popup
│
├── gallery/            # Gallery components
│   ├── PhotoGallery.tsx      # Main gallery grid
│   ├── Lightbox.tsx          # PhotoSwipe wrapper
│   └── PhotoCard.tsx         # Individual photo card
│
├── upload/             # Upload interface
│   ├── DropZone.tsx          # Drag-and-drop area
│   ├── ImagePreview.tsx      # Preview before upload
│   └── UploadProgress.tsx    # Progress indicator
│
├── dashboard/          # Dashboard components
│   ├── ProjectCard.tsx
│   ├── ProjectList.tsx
│   └── StatsCard.tsx
│
└── auth/               # Authentication forms
    ├── LoginForm.tsx
    └── RegisterForm.tsx
```

## Data Flow Patterns

### 1. Image Upload Flow

```
User selects file
    ↓
Client validates (size, type)
    ↓
Request signed upload URL from /api/upload
    ↓
Client uploads directly to Vercel Blob
    ↓
Client notifies /api/photos with metadata
    ↓
Server saves photo record to database
    ↓
Server updates project photoCount
    ↓
Client shows success, refreshes gallery
```

**Benefits:**
- Large files don't go through Next.js server
- Faster uploads with direct-to-storage
- Server only handles metadata
- Automatic CDN distribution

### 2. Authentication Flow

```
User submits credentials
    ↓
NextAuth.js verifies with database
    ↓
Session created with JWT
    ↓
Role stored in session
    ↓
Middleware checks auth on protected routes
    ↓
UI adapts based on role (PHOTOGRAPHER vs ADMIN)
```

### 3. Static Generation Flow (Public Pages)

```
Build time:
  ↓
Fetch all published projects from DB
  ↓
Generate static pages for each town/year
  ↓
Pre-render with photos and metadata
  ↓
Deploy to Vercel edge network
  ↓
User visits → Instant load (no DB query)
```

**Revalidation:**
- On-demand: When admin publishes new project
- Time-based: Every 24 hours (optional)

## Security Architecture

### Authentication
- **Password hashing**: bcrypt with salt rounds
- **Session management**: JWT tokens via NextAuth.js
- **Token storage**: HTTP-only cookies
- **CSRF protection**: Built into Next.js

### Authorization
- **Role-based access control (RBAC)**
- **Route protection**: Middleware checks
- **API protection**: Session verification
- **Row-level security**: Prisma filters by userId

### File Upload Security
- **Type validation**: Only images (JPEG, PNG, WebP)
- **Size limits**: 10MB per file
- **Virus scanning**: (Optional) ClamAV integration
- **Signed URLs**: Time-limited upload permissions
- **CORS**: Restricted to application domain

### Data Protection
- **SQL injection**: Prevented by Prisma ORM
- **XSS**: React escaping + Content Security Policy
- **Rate limiting**: (TODO) Implement for API routes
- **Environment variables**: Never committed to repo

## Performance Optimizations

### Frontend
1. **Image Optimization**
   - Next.js Image component with automatic WebP
   - Lazy loading below fold
   - Responsive srcsets for different devices
   - Blur-up placeholders

2. **Code Splitting**
   - Automatic route-based splitting
   - Dynamic imports for heavy components (PhotoSwipe, Mapbox)
   - Tree shaking of unused code

3. **Caching**
   - Static page generation for public routes
   - Stale-while-revalidate for API responses
   - Browser caching for images (CDN)

### Backend
1. **Database**
   - Indexed foreign keys
   - Connection pooling (Prisma)
   - Query optimization with `include` and `select`

2. **API Routes**
   - Edge runtime where possible
   - Response caching headers
   - Pagination for large datasets

## Deployment Architecture

### Vercel Platform

```
GitHub Push
    ↓
Vercel Build
    ↓
├── Install dependencies
├── Run Prisma generate
├── Build Next.js app
├── Run static generation
└── Deploy to edge
    ↓
Live on vercel.app domain
    ↓
Custom domain (smalltown.gallery)
```

### Environment Variables

**Development (.env.local):**
- Database URLs (local/dev)
- NextAuth secrets (dev keys)
- API keys (dev/test accounts)

**Production (Vercel dashboard):**
- Production database connection
- Production secrets (rotated)
- Production API keys
- Auto-populated by Vercel services

### Database Migrations

**Development:**
```bash
npx prisma migrate dev --name migration_name
```

**Production:**
```bash
npx prisma migrate deploy
```

**Automated in CI/CD:**
- Run migrations before deployment
- Rollback on failure

## Monitoring & Observability

### Vercel Analytics
- Page views and visitor data
- Web Vitals (CLS, FCP, LCP, FID, TTFB)
- API route performance

### Error Tracking (TODO)
- Sentry integration for error monitoring
- User feedback on errors
- Performance monitoring

### Database Monitoring
- Vercel Postgres dashboard
- Query performance insights
- Connection pool metrics

## Future Enhancements

### Phase 2 Features
1. **Email notifications**
   - User approval emails
   - Project published notifications
   - Weekly digest for admins

2. **Advanced search**
   - Full-text search across captions
   - Filter by year range, photographer
   - Map-based search radius

3. **Social features**
   - Comments on photos
   - Favorite/bookmark photos
   - Share individual photos

### Phase 3 Features
1. **Mobile apps**
   - React Native iOS/Android
   - Offline photo capture
   - GPS tagging

2. **Analytics dashboard**
   - Photo view counts
   - Popular towns
   - Photographer statistics

3. **Export tools**
   - PDF portfolio generation
   - Print layout templates
   - Bulk download for archival

## Maintenance

### Regular Tasks
- **Weekly**: Review pending user approvals
- **Monthly**: Database backup verification
- **Quarterly**: Security dependency updates
- **Yearly**: Archive old projects

### Backup Strategy
- **Database**: Automatic daily backups (Vercel)
- **Images**: Redundant storage in Vercel Blob
- **Code**: Git repository with tags for releases

## Development Workflow

### Local Development
1. Create feature branch from `main`
2. Make changes with hot reload
3. Test locally with dev database
4. Commit with descriptive messages
5. Push and create pull request
6. Deploy preview on Vercel
7. Review and merge to `main`
8. Auto-deploy to production

### Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js config + custom rules
- **Prettier**: Auto-formatting on save
- **Husky**: Pre-commit hooks (lint, format)

## Support & Documentation

### For Photographers
- User guide for uploading photos
- Best practices for captions
- Image requirements (size, format)

### For Admins
- User management guide
- Town addition process
- Content moderation guidelines

### For Developers
- Setup instructions (README.md)
- Architecture docs (this file)
- API documentation (TBD)
- Component Storybook (TBD)
