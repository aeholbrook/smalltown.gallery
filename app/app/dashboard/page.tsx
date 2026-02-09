import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Plus, Eye, EyeOff, ImageIcon, Camera } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — Small Town Documentary',
}

export default async function DashboardPage() {
  const session = await auth()

  const projects = await prisma.project.findMany({
    where: { userId: session!.user!.id },
    include: { town: true },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Your Projects
        </h1>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          <Plus size={16} />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <Camera size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
            No projects yet
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Create your first project to start documenting a small town.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            <Plus size={16} />
            Create First Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                    {project.town.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {project.year}
                  </p>
                </div>
                {project.published ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                    <Eye size={12} />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <EyeOff size={12} />
                    Draft
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <ImageIcon size={12} />
                  {project.photoCount} photo{project.photoCount !== 1 ? 's' : ''}
                </span>
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
