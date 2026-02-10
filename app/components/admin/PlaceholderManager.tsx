'use client'

import { useActionState, useState } from 'react'
import { createPlaceholderProject, claimPlaceholderProject } from '@/lib/actions/admin'

interface TownOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string
  email: string
}

interface PlaceholderProject {
  id: string
  townName: string
  year: number
  photographer: string
  photoCount: number
  published: boolean
}

export function PlaceholderManager({
  towns,
  users,
  placeholders,
}: {
  towns: TownOption[]
  users: UserOption[]
  placeholders: PlaceholderProject[]
}) {
  const [createState, createAction, createPending] = useActionState(createPlaceholderProject, { error: null })
  const [claimState, claimAction, claimPending] = useActionState(claimPlaceholderProject, { error: null })
  const [townId, setTownId] = useState(towns[0]?.id || '')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [photographer, setPhotographer] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '')
  const [publishOnClaim, setPublishOnClaim] = useState(false)

  const error = createState?.error || claimState?.error

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Create Placeholder Project</h2>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-400 mb-3">
            {error}
          </div>
        )}

        <form action={createAction} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Town</label>
            <select
              name="townId"
              value={townId}
              onChange={(e) => setTownId(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-white"
            >
              {towns.map(town => (
                <option key={town.id} value={town.id}>{town.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Year</label>
            <input
              name="year"
              type="number"
              min={1900}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Photographer</label>
            <input
              name="photographer"
              value={photographer}
              onChange={(e) => setPhotographer(e.target.value)}
              placeholder="Unassigned"
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={createPending}
              className="inline-flex items-center rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {createPending ? 'Creating...' : 'Create Placeholder'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Placeholder Projects</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Town</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Year</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Photographer</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Photos</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Claim</th>
              </tr>
            </thead>
            <tbody>
              {placeholders.map(project => (
                <tr key={project.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">{project.townName}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.year}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.photographer}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.photoCount}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{project.published ? 'Published' : 'Draft'}</td>
                  <td className="px-4 py-3">
                    <form action={claimAction} className="flex items-center gap-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      {publishOnClaim && <input type="hidden" name="publishOnClaim" value="1" />}
                      <select
                        name="userId"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-white"
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
                        className="inline-flex items-center rounded border border-amber-200 dark:border-amber-800 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                      >
                        {claimPending ? 'Claiming...' : 'Claim'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <label className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={publishOnClaim}
              onChange={(e) => setPublishOnClaim(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700"
            />
            Publish on claim
          </label>
        </div>

        {placeholders.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No placeholder projects found.
          </p>
        )}
      </div>
    </div>
  )
}
