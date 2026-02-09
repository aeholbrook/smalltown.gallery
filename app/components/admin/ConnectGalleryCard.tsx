'use client'

import { useActionState, useState } from 'react'
import { Link2, Unlink, ImageIcon } from 'lucide-react'
import { claimGallery, connectGallery, disconnectGallery } from '@/lib/actions/admin'

interface User {
  id: string
  name: string
  email: string
}

interface ConnectGalleryCardProps {
  townName: string
  year: number
  photographer: string
  photoCount: number
  connectedUser: { id: string; name: string } | null
  claimable: boolean
  users: User[]
}

export function ConnectGalleryCard({
  townName,
  year,
  photographer,
  photoCount,
  connectedUser,
  claimable,
  users,
}: ConnectGalleryCardProps) {
  const [connectState, connectAction, connectPending] = useActionState(connectGallery, { error: null })
  const [claimState, claimAction, claimPending] = useActionState(claimGallery, { error: null })
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(disconnectGallery, { error: null })
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '')
  const [publishOnClaim, setPublishOnClaim] = useState(false)

  const error = connectState?.error || claimState?.error || disconnectState?.error

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">{townName}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {year} &middot; {photographer}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <ImageIcon size={12} />
          {photoCount} photos
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-400 mb-3">
          {error}
        </div>
      )}

      {connectedUser ? (
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 text-sm ${claimable ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
            <Link2 size={14} />
            {claimable ? `Placeholder: ${connectedUser.name}` : `Connected to ${connectedUser.name}`}
          </span>
          <div className="flex items-end gap-2">
            {claimable && (
              <form action={claimAction} className="flex items-end gap-2">
                <input type="hidden" name="townName" value={townName} />
                <input type="hidden" name="year" value={year} />
                {publishOnClaim && <input type="hidden" name="publishOnClaim" value="1" />}
                <select
                  name="userId"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={claimPending || users.length === 0}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 transition-colors"
                >
                  <Link2 size={12} />
                  {claimPending ? 'Claiming...' : 'Claim'}
                </button>
                <label className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={publishOnClaim}
                    onChange={(e) => setPublishOnClaim(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700"
                  />
                  Publish on claim
                </label>
              </form>
            )}

            <form action={disconnectAction}>
              <input type="hidden" name="townName" value={townName} />
              <input type="hidden" name="year" value={year} />
              <button
                type="submit"
                disabled={disconnectPending}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
              >
                <Unlink size={12} />
                {disconnectPending ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={connectAction} className="flex items-end gap-2">
          <input type="hidden" name="townName" value={townName} />
          <input type="hidden" name="year" value={year} />
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Assign to user
            </label>
            <select
              name="userId"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={connectPending || users.length === 0}
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <Link2 size={14} />
            {connectPending ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      )}
    </div>
  )
}
