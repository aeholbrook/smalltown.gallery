'use client'

import { useActionState, useState } from 'react'
import { Link2, Unlink } from 'lucide-react'
import { bulkConnectGalleries, bulkDisconnectGalleries } from '@/lib/actions/admin'

interface User {
  id: string
  name: string
  email: string
}

interface Gallery {
  townName: string
  year: number
  connected: boolean
}

interface BulkConnectControlsProps {
  galleries: Gallery[]
  users: User[]
}

export function BulkConnectControls({ galleries, users }: BulkConnectControlsProps) {
  const [connectState, connectAction, connectPending] = useActionState(bulkConnectGalleries, { error: null })
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(bulkDisconnectGalleries, { error: null })
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '')

  const unconnected = galleries.filter(g => !g.connected)
  const connected = galleries.filter(g => g.connected)

  const error = connectState?.error || disconnectState?.error

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 mb-6">
      <h2 className="font-semibold text-zinc-900 dark:text-white mb-3">Bulk Actions</h2>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-400 mb-3">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {unconnected.length > 0 && (
          <form action={connectAction} className="flex items-end gap-2 flex-1">
            <input
              type="hidden"
              name="galleries"
              value={JSON.stringify(unconnected.map(g => ({ townName: g.townName, year: g.year })))}
            />
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Connect all {unconnected.length} unconnected to:
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
              className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Link2 size={14} />
              {connectPending ? 'Connecting...' : `Connect All (${unconnected.length})`}
            </button>
          </form>
        )}

        {connected.length > 0 && (
          <form action={disconnectAction}>
            <input
              type="hidden"
              name="galleries"
              value={JSON.stringify(connected.map(g => ({ townName: g.townName, year: g.year })))}
            />
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Disconnect all {connected.length} connected:
            </label>
            <button
              type="submit"
              disabled={disconnectPending}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 dark:border-red-800 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Unlink size={14} />
              {disconnectPending ? 'Disconnecting...' : `Disconnect All (${connected.length})`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
