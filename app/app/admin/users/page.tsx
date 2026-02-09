import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatDate, cn } from '@/lib/utils'
import { UserActions } from '@/components/admin/UserActions'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Users — Admin',
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    ADMIN: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    PHOTOGRAPHER: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    PENDING: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
  }

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[role as keyof typeof styles] || styles.PENDING}`}>
      {role}
    </span>
  )
}

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { filter } = await searchParams
  const session = await auth()

  const where = filter === 'pending'
    ? { role: 'PENDING' as const }
    : filter === 'photographers'
    ? { role: 'PHOTOGRAPHER' as const }
    : filter === 'admins'
    ? { role: 'ADMIN' as const }
    : {}

  const users = await prisma.user.findMany({
    where,
    include: { _count: { select: { projects: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const tabs = [
    { label: 'All', href: '/admin/users', active: !filter },
    { label: 'Pending', href: '/admin/users?filter=pending', active: filter === 'pending' },
    { label: 'Photographers', href: '/admin/users?filter=photographers', active: filter === 'photographers' },
    { label: 'Admins', href: '/admin/users?filter=admins', active: filter === 'admins' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Users</h1>

      <div className="flex gap-1 mb-6">
        {tabs.map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition-colors',
              tab.active
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Role</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Projects</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user._count.projects}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <UserActions
                      userId={user.id}
                      userName={user.name}
                      role={user.role}
                      isSelf={user.id === session!.user!.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No users found.
          </p>
        )}
      </div>
    </div>
  )
}
