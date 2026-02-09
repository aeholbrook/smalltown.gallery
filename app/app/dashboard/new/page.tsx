import { prisma } from '@/lib/db'
import { CreateProjectForm } from '@/components/dashboard/CreateProjectForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Project — Small Town Documentary',
}

export default async function NewProjectPage() {
  const towns = await prisma.town.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Create New Project
      </h1>
      <div className="max-w-lg">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <CreateProjectForm towns={towns} />
        </div>
      </div>
    </div>
  )
}
