import { prisma } from '@/lib/db'
import { Users, UserCheck, FolderOpen, Eye } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin — Small Town Documentary',
}

export default async function AdminOverviewPage() {
  const [totalUsers, pendingUsers, totalProjects, publishedProjects] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PENDING' } }),
      prisma.project.count(),
      prisma.project.count({ where: { published: true } }),
    ])

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, highlight: false },
    { label: 'Pending Approvals', value: pendingUsers, icon: UserCheck, highlight: pendingUsers > 0 },
    { label: 'Total Projects', value: totalProjects, icon: FolderOpen, highlight: false },
    { label: 'Published', value: publishedProjects, icon: Eye, highlight: false },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Admin Overview
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, highlight }) => (
          <div
            key={label}
            className={`rounded-lg border p-5 ${
              highlight
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon size={18} className={highlight ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500'} />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
            </div>
            <p className={`text-3xl font-bold ${
              highlight ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'
            }`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
