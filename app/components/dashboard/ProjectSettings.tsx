'use client'

import { useActionState, useState } from 'react'
import { updateProject, deleteProject } from '@/lib/actions/projects'

interface ProjectSettingsProps {
  project: {
    id: string
    title: string | null
    description: string | null
    notes: string | null
    town: { name: string }
  }
}

export function ProjectSettings({ project }: ProjectSettingsProps) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateProject,
    { error: null, success: false }
  )
  const [, deleteAction, deletePending] = useActionState(deleteProject, {
    error: null,
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Project Details
        </h2>
        <form action={updateAction} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />

          {updateState?.error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              {updateState.error}
            </div>
          )}
          {updateState?.success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
              Project updated successfully.
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Title{' '}
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                (optional, defaults to town name)
              </span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              defaultValue={project.title || ''}
              placeholder={project.town.name}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={project.description || ''}
              placeholder="Describe your project, artist statement..."
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Notes{' '}
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                (private, not shown publicly)
              </span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={project.notes || ''}
              placeholder="Field notes, process reflections..."
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={updatePending}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updatePending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
          Danger Zone
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Permanently delete this project and all its photos. This cannot be
          undone.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete Project
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <form action={deleteAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletePending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </form>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-md px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
