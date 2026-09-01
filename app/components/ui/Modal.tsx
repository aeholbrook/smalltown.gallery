'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  maxWidthClass?: string
  children: ReactNode
}

/**
 * Shared modal built on the native <dialog> element, which provides focus
 * trapping, Escape-to-close, and focus restoration for free.
 */
export default function Modal({
  open,
  onClose,
  title,
  maxWidthClass = 'max-w-lg',
  children,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) dialog.showModal()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        // Clicks that land on the dialog itself (not the panel) are backdrop clicks
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
      className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-end justify-center bg-transparent p-0 sm:items-center backdrop:bg-zinc-900/40 dark:backdrop:bg-black/60"
    >
      <div
        className={`relative w-full ${maxWidthClass} max-h-[70vh] overflow-y-auto bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-t-xl sm:rounded-xl p-6 sm:p-8 animate-slide-up transition-colors`}
      >
        <button
          onClick={() => ref.current?.close()}
          aria-label={`Close ${title}`}
          className="absolute top-4 right-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
