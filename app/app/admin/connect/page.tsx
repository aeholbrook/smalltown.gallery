import { prisma } from '@/lib/db'
import { townsWithPhotos } from '@/lib/towns'
import { ConnectGalleryCard } from '@/components/admin/ConnectGalleryCard'
import { BulkConnectControls } from '@/components/admin/BulkConnectControls'
import fs from 'fs/promises'
import path from 'path'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connect Galleries — Admin',
}

const TOWNS_ROOT = path.join(process.cwd(), '..', 'towns')

export default async function ConnectGalleriesPage() {
  // Get all non-PENDING users for assignment dropdown
  const users = await prisma.user.findMany({
    where: { role: { not: 'PENDING' } },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })

  // Batch fetch all relevant towns and projects from DB
  const townNames = townsWithPhotos.map(t => t.name)
  const dbTowns = await prisma.town.findMany({
    where: { name: { in: townNames } },
    select: { id: true, name: true },
  })
  const townNameToId = new Map(dbTowns.map(t => [t.name, t.id]))
  const townIds = dbTowns.map(t => t.id)

  const connectedProjects = await prisma.project.findMany({
    where: { townId: { in: townIds } },
    include: {
      user: { select: { id: true, name: true } },
      town: { select: { name: true } },
    },
  })

  // Index connected projects by "townName-year"
  const connectedMap = new Map(
    connectedProjects.map(p => [`${p.town.name}-${p.year}`, p.user])
  )

  // Build gallery data from filesystem
  const galleries = await Promise.all(
    townsWithPhotos.flatMap(town =>
      (town.years || []).map(async ({ year, photographer }) => {
        const yearDir = path.join(TOWNS_ROOT, town.name, String(year))
        let photoCount = 0
        try {
          const files = await fs.readdir(yearDir)
          photoCount = files.filter(f => /\.(jpg|jpeg)$/i.test(f) && !f.endsWith('~')).length
        } catch {
          // directory may not exist
        }

        const connectedUser = connectedMap.get(`${town.name}-${year}`) || null

        return {
          townName: town.name,
          year,
          photographer,
          photoCount,
          connectedUser,
        }
      })
    )
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
        Connect Filesystem Galleries
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Assign existing photo galleries from the filesystem to user accounts.
        Connected galleries appear in the photographer&apos;s dashboard and on the public map.
      </p>

      {users.length > 0 && galleries.length > 0 && (
        <BulkConnectControls
          galleries={galleries.map(g => ({
            townName: g.townName,
            year: g.year,
            connected: !!g.connectedUser,
          }))}
          users={users}
        />
      )}

      {users.length === 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 mb-6 text-sm text-amber-700 dark:text-amber-400">
          No approved users available. Approve a user first before connecting galleries.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {galleries.map(gallery => (
          <ConnectGalleryCard
            key={`${gallery.townName}-${gallery.year}`}
            {...gallery}
            users={users}
          />
        ))}
      </div>
    </div>
  )
}
