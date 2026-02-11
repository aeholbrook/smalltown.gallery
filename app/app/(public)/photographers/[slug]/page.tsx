import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Globe, MapPin } from 'lucide-react'
import Header from '@/components/ui/Header'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

interface PhotographerProfileData {
  id: string
  name: string
  bio: string | null
  website: string | null
  location: string | null
  profilePhotoUrl: string | null
}

interface PhotographerProjectData {
  id: string
  year: number
  photoCount: number
  town: { name: string }
}

interface ResolvedPhotographerPageData {
  photographer: PhotographerProfileData
  projects: PhotographerProjectData[]
  hasUserProfile: boolean
}

async function resolvePhotographerPageData(slug: string): Promise<ResolvedPhotographerPageData | null> {
  const users = await prisma.user.findMany({
    where: {
      role: { not: 'PENDING' },
      projects: { some: { published: true } },
    },
    select: {
      id: true,
      name: true,
      bio: true,
      website: true,
      location: true,
      profilePhotoUrl: true,
    },
  })

  const matchedUser = users.find(user => slugify(user.name) === slug)
  if (matchedUser) {
    const projects = await prisma.project.findMany({
      where: { userId: matchedUser.id, published: true },
      include: { town: true },
      orderBy: [{ year: 'desc' }, { town: { name: 'asc' } }],
    })

    return {
      photographer: matchedUser,
      projects,
      hasUserProfile: true,
    }
  }

  const publishedProjects = await prisma.project.findMany({
    where: { published: true },
    include: { town: true },
    orderBy: [{ year: 'desc' }, { town: { name: 'asc' } }],
  })

  const fallbackProjects = publishedProjects.filter(project => slugify(project.photographer) === slug)
  if (fallbackProjects.length === 0) return null

  return {
    photographer: {
      id: `fallback-${slug}`,
      name: fallbackProjects[0].photographer,
      bio: null,
      website: null,
      location: null,
      profilePhotoUrl: null,
    },
    projects: fallbackProjects,
    hasUserProfile: false,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pageData = await resolvePhotographerPageData(slug)
  if (!pageData) return { title: 'Photographer Not Found' }

  const { photographer, hasUserProfile } = pageData

  return {
    title: `${photographer.name} — Photographer`,
    description: hasUserProfile && photographer.bio
      ? photographer.bio.slice(0, 160)
      : `View documentary projects credited to ${photographer.name}.`,
  }
}

export default async function PhotographerPage({ params }: PageProps) {
  const { slug } = await params

  const pageData = await resolvePhotographerPageData(slug)
  if (!pageData) notFound()

  const { photographer, projects, hasUserProfile } = pageData

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Map
        </Link>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="h-28 w-28 overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
              {photographer.profilePhotoUrl ? (
                <img
                  src={photographer.profilePhotoUrl}
                  alt={photographer.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-zinc-400">
                  {photographer.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {photographer.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                {hasUserProfile && photographer.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />
                    {photographer.location}
                  </span>
                )}
                {hasUserProfile && photographer.website && (
                  <a
                    href={photographer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white"
                  >
                    <Globe size={14} />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {!hasUserProfile && (
            <div className="mt-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm text-zinc-600 dark:text-zinc-400">
              {photographer.name} has not set up a public profile yet. Showing published towns and years credited to this photographer.
            </div>
          )}

          {hasUserProfile && photographer.bio && (
            <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <MarkdownRenderer content={photographer.bio} />
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
            Published Projects ({projects.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/towns/${slugify(project.town.name)}/${project.year}`}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-amber-400 dark:hover:border-amber-500 transition-colors"
              >
                <p className="text-base font-semibold text-zinc-900 dark:text-white">
                  {project.town.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {project.year} {project.photoCount ? `· ${project.photoCount} photos` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
