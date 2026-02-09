'use client'

import { useActionState } from 'react'
import {
  approveUser,
  rejectUser,
  promoteToAdmin,
  demoteToPhotographer,
} from '@/lib/actions/admin'
import { ResetPasswordButton } from './ResetPasswordButton'

interface UserActionsProps {
  userId: string
  userName: string
  role: string
  isSelf: boolean
}

export function UserActions({ userId, userName, role, isSelf }: UserActionsProps) {
  const [approveState, approveAction, approvePending] = useActionState(approveUser, { error: null })
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectUser, { error: null })
  const [promoteState, promoteAction, promotePending] = useActionState(promoteToAdmin, { error: null })
  const [demoteState, demoteAction, demotePending] = useActionState(demoteToPhotographer, { error: null })

  const error = approveState?.error || rejectState?.error || promoteState?.error || demoteState?.error

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
      {role === 'PENDING' && (
        <>
          <form action={approveAction}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              disabled={approvePending}
              className="rounded px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
            >
              {approvePending ? 'Approving...' : 'Approve'}
            </button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="userId" value={userId} />
            <button
              type="submit"
              disabled={rejectPending}
              className="rounded px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
            >
              {rejectPending ? 'Rejecting...' : 'Reject'}
            </button>
          </form>
        </>
      )}
      {role === 'PHOTOGRAPHER' && (
        <form action={promoteAction}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            disabled={promotePending}
            className="rounded px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
          >
            {promotePending ? 'Promoting...' : 'Make Admin'}
          </button>
        </form>
      )}
      {role === 'ADMIN' && !isSelf && (
        <form action={demoteAction}>
          <input type="hidden" name="userId" value={userId} />
          <button
            type="submit"
            disabled={demotePending}
            className="rounded px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {demotePending ? 'Demoting...' : 'Demote'}
          </button>
        </form>
      )}
      {role === 'ADMIN' && isSelf && (
        <span className="text-xs text-zinc-400">You</span>
      )}
      {role !== 'PENDING' && !isSelf && (
        <ResetPasswordButton userId={userId} userName={userName} />
      )}
    </div>
  )
}
