import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PlaceholderManager } from '@/components/admin/PlaceholderManager'

export const metadata: Metadata = {
  title: 'Placeholders — Admin',
}

const PLACEHOLDER_EMAIL = process.env.LEGACY_PLACEHOLDER_EMAIL || 'unclaimed@smalltown.gallery'

export default async function AdminPlaceholdersPage() {
  const [towns, users, placeholders] = await Promise.all([
    prisma.town.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: { not: 'PENDING' } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.project.findMany({
      where: {
        user: {
          email: PLACEHOLDER_EMAIL,
        },
      },
      include: {
        town: { select: { name: true } },
      },
      orderBy: [{ year: 'desc' }, { town: { name: 'asc' } }],
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Placeholder Projects</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Create unclaimed placeholders and assign them to photographers later.
      </p>

      <PlaceholderManager
        towns={towns}
        users={users}
        placeholders={placeholders.map(p => ({
          id: p.id,
          townName: p.town.name,
          year: p.year,
          photographer: p.photographer,
          photoCount: p.photoCount,
          published: p.published,
        }))}
      />
    </div>
  )
}
