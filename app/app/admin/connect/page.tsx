import { prisma } from '@/lib/db'
import { townsWithPhotos } from '@/lib/towns'
import { ConnectGalleryCard } from '@/components/admin/ConnectGalleryCard'
import { BulkConnectControls } from '@/components/admin/BulkConnectControls'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connect Galleries — Admin',
}

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
  const townIds = dbTowns.map(t => t.id)

  const connectedProjects = await prisma.project.findMany({
    where: { townId: { in: townIds } },
    include: {
      user: { select: { id: true, name: true, role: true } },
      town: { select: { name: true } },
    },
  })

  // Index connected projects by "townName-year"
  const connectedMap = new Map(
    connectedProjects.map(p => [
      `${p.town.name}-${p.year}`,
      {
        user: p.user,
        photoCount: p.photoCount,
        claimable: p.user.role === 'PENDING',
      },
    ])
  )

  // Build gallery data from static town/year list + DB project info.
  const galleries = townsWithPhotos.flatMap(town =>
    (town.years || []).map(({ year, photographer }) => {
      const connectedInfo = connectedMap.get(`${town.name}-${year}`) || null
      return {
        townName: town.name,
        year,
        photographer,
        photoCount: connectedInfo?.photoCount || 0,
        connectedUser: connectedInfo ? { id: connectedInfo.user.id, name: connectedInfo.user.name } : null,
        claimable: connectedInfo?.claimable || false,
      }
    })
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
        Connect and Claim Galleries
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Assign unconnected galleries and claim placeholder galleries to real users.
        Claimed galleries appear in the photographer&apos;s dashboard.
      </p>

      {users.length > 0 && galleries.length > 0 && (
        <BulkConnectControls
          galleries={galleries.map(g => ({
            townName: g.townName,
            year: g.year,
            connected: !!g.connectedUser,
            claimable: g.claimable,
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
