import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectHeader } from '@/components/dashboard/ProjectHeader'
import { PhotoUploader } from '@/components/dashboard/PhotoUploader'
import { PhotoGrid } from '@/components/dashboard/PhotoGrid'
import { ProjectSettings } from '@/components/dashboard/ProjectSettings'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: { town: true },
  })
  if (!project) return { title: 'Project Not Found — Admin' }
  return { title: `${project.town.name} ${project.year} — Admin Project` }
}

export default async function AdminProjectDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      town: true,
      photos: { orderBy: { order: 'asc' } },
    },
  })
  if (!project) notFound()

  return (
    <div className="space-y-8">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Admin Projects
      </Link>

      <ProjectHeader project={project} />
      <PhotoUploader projectId={project.id} />
      <PhotoGrid photos={project.photos} projectId={project.id} />
      <ProjectSettings project={project} />
    </div>
  )
}
