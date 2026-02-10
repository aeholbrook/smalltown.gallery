import { prisma } from '@/lib/db'
import { AdminProjectActions } from '@/components/admin/AdminProjectActions'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects — Admin',
}

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { town: true, user: true },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        All Projects
      </h1>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Town</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Year</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Photographer</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Photos</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">
                    <Link href={`/admin/projects/${project.id}`} className="hover:underline">
                      {project.town.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.year}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.photographer}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.user.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      project.published
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {project.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.photoCount}</td>
                  <td className="px-4 py-3">
                    <AdminProjectActions projectId={project.id} published={project.published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {projects.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No projects found.
          </p>
        )}
      </div>
    </div>
  )
}
