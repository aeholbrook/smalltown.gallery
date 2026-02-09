'use client'

import { useActionState, useState } from 'react'
import { createProject } from '@/lib/actions/projects'

interface Town {
  id: string
  name: string
}

export function CreateProjectForm({ towns }: { towns: Town[] }) {
  const [state, formAction, pending] = useActionState(createProject, {
    error: null,
  })
  const [search, setSearch] = useState('')

  const filteredTowns = search
    ? towns.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      )
    : towns

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="townSearch"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Town
        </label>
        <input
          id="townSearch"
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search towns..."
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 mb-1"
        />
        <select
          id="townId"
          name="townId"
          required
          size={6}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {filteredTowns.map((town) => (
            <option key={town.id} value={town.id}>
              {town.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          {filteredTowns.length} of {towns.length} towns
        </p>
      </div>

      <div>
        <label
          htmlFor="year"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Year
        </label>
        <input
          id="year"
          name="year"
          type="number"
          required
          min={2000}
          max={new Date().getFullYear() + 1}
          defaultValue={new Date().getFullYear()}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Title{' '}
          <span className="font-normal text-zinc-400 dark:text-zinc-500">
            (optional)
          </span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Main Street Stories"
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
        >
          Description{' '}
          <span className="font-normal text-zinc-400 dark:text-zinc-500">
            (optional)
          </span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Describe your project..."
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  )
}
