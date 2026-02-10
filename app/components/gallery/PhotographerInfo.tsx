'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PhotographerInfoProps {
  descriptionHtml: string
}

export function PhotographerInfo({ descriptionHtml }: PhotographerInfoProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 p-6 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
          About the Photographer
        </h2>
        {expanded ? (
          <ChevronUp className="text-zinc-400" size={20} />
        ) : (
          <ChevronDown className="text-zinc-400" size={20} />
        )}
      </button>
      {expanded && (
        <div
          className="mt-4 max-w-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_p]:mb-4 [&_p]:leading-relaxed [&_em]:text-zinc-500 dark:[&_em]:text-zinc-400"
          style={{ fontFamily: 'var(--font-garamond), Georgia, "Times New Roman", serif' }}
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      )}
    </div>
  )
}
