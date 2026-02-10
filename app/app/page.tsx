import Header from '@/components/ui/Header'
import AboutPanel from '@/components/ui/AboutPanel'
import TownList from '@/components/ui/TownList'
import MapLoader from '@/components/map/MapLoader'
import RollingGallery from '@/components/map/RollingGallery'
import { prisma } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { getRandomGalleryPreviews } from '@/lib/gallery'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function Home() {
  noStore()
  // Fetch published DB projects to merge into map data
  let dbProjects: { townName: string; slug: string; year: number; photographer: string }[] = []
  try {
    const projects = await prisma.project.findMany({
      where: { published: true },
      include: { town: true },
    })
    dbProjects = projects.map(p => ({
      townName: p.town.name,
      slug: slugify(p.town.name),
      year: p.year,
      photographer: p.photographer,
    }))
  } catch {
    // DB not available is fine, map still works with static data
  }

  // Get random photos for rolling gallery sidebars
  const leftPreviews = await getRandomGalleryPreviews(12)
  const rightPreviews = await getRandomGalleryPreviews(12)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950 transition-colors">
      <Header />
      <main className="relative flex flex-1 min-h-0">
        {/* Left rolling gallery — hidden on small screens */}
        <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 transition-colors">
          <RollingGallery previews={leftPreviews} direction="up" />
        </div>

        {/* Map (takes remaining space) */}
        <div className="relative flex-1 min-w-0">
          <MapLoader dbProjects={dbProjects} />
        </div>

        {/* Right rolling gallery — hidden on small screens */}
        <div className="hidden lg:block w-56 xl:w-64 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 transition-colors">
          <RollingGallery previews={rightPreviews} direction="down" />
        </div>
      </main>
      <BottomBar />
    </div>
  )
}

function BottomBar() {
  return (
    <div className="flex items-center justify-center gap-8 bg-zinc-200 dark:bg-zinc-900 border-t border-zinc-300 dark:border-zinc-800 px-4 py-2 transition-colors">
      <AboutPanel />
      <TownList />
    </div>
  )
}
