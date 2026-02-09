'use client'

import { useActionState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toggleProjectPublished } from '@/lib/actions/projects'

interface ProjectHeaderProps {
  project: {
    id: string
    year: number
    published: boolean
    photoCount: number
    title: string | null
    town: { name: string }
  }
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [, formAction, pending] = useActionState(toggleProjectPublished, {
    error: null,
  })

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          {project.title || project.town.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {project.title ? `${project.town.name} — ` : ''}
          {project.year} &middot; {project.photoCount} photo
          {project.photoCount !== 1 ? 's' : ''}
        </p>
      </div>
      <form action={formAction}>
        <input type="hidden" name="projectId" value={project.id} />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            project.published
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {project.published ? (
            <>
              <EyeOff size={16} />
              Unpublish
            </>
          ) : (
            <>
              <Eye size={16} />
              Publish
            </>
          )}
        </button>
      </form>
    </div>
  )
}
