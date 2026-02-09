'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { adminTogglePublished, adminDeleteProject } from '@/lib/actions/admin'

interface AdminProjectActionsProps {
  projectId: string
  published: boolean
}

export function AdminProjectActions({ projectId, published }: AdminProjectActionsProps) {
  const [toggleState, toggleAction, togglePending] = useActionState(adminTogglePublished, { error: null })
  const [deleteState, deleteAction, deletePending] = useActionState(adminDeleteProject, { error: null })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const error = toggleState?.error || deleteState?.error

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
      <form action={toggleAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <button
          type="submit"
          disabled={togglePending}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {published ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
        </button>
      </form>
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <form action={deleteAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              disabled={deletePending}
              className="rounded px-2 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deletePending ? 'Deleting...' : 'Confirm'}
            </button>
          </form>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
