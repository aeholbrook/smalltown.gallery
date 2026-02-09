'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  X,
  Check,
  ImageIcon,
} from 'lucide-react'
import { deletePhoto, updatePhotoCaption, reorderPhotos } from '@/lib/actions/photos'
import { formatBytes } from '@/lib/utils'

interface Photo {
  id: string
  filename: string
  blobUrl: string
  caption: string | null
  width: number
  height: number
  size: number
  order: number
}

export function PhotoGrid({
  photos,
  projectId,
}: {
  photos: Photo[]
  projectId: string
}) {
  const router = useRouter()
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [reordering, startReorder] = useTransition()

  const movePhoto = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= photos.length) return

    const newOrder = photos.map((p) => p.id)
    ;[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]

    startReorder(async () => {
      await reorderPhotos(projectId, newOrder)
      router.refresh()
    })
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
        <ImageIcon
          size={48}
          className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4"
        />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No photos uploaded yet. Use the uploader above to add photos.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
        Photos ({photos.length})
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
            total={photos.length}
            isEditingCaption={editingCaption === photo.id}
            onEditCaption={() => setEditingCaption(photo.id)}
            onCancelCaption={() => setEditingCaption(null)}
            onMoveLeft={() => movePhoto(index, -1)}
            onMoveRight={() => movePhoto(index, 1)}
            reordering={reordering}
          />
        ))}
      </div>
    </div>
  )
}

function PhotoCard({
  photo,
  index,
  total,
  isEditingCaption,
  onEditCaption,
  onCancelCaption,
  onMoveLeft,
  onMoveRight,
  reordering,
}: {
  photo: Photo
  index: number
  total: number
  isEditingCaption: boolean
  onEditCaption: () => void
  onCancelCaption: () => void
  onMoveLeft: () => void
  onMoveRight: () => void
  reordering: boolean
}) {
  const [, deleteAction, deletePending] = useActionState(deletePhoto, {
    error: null,
  })
  const [, captionAction, captionPending] = useActionState(
    updatePhotoCaption,
    { error: null }
  )

  return (
    <div className="group relative">
      <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.blobUrl}
          alt={photo.caption || photo.filename}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Overlay controls */}
      <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-colors flex items-end opacity-0 group-hover:opacity-100">
        <div className="w-full p-2 flex items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={onMoveLeft}
              disabled={index === 0 || reordering}
              className="rounded p-1 bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 transition-colors"
              title="Move left"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={onMoveRight}
              disabled={index === total - 1 || reordering}
              className="rounded p-1 bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 transition-colors"
              title="Move right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEditCaption}
              className="rounded p-1 bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Edit caption"
            >
              <MessageSquare size={14} />
            </button>
            <form action={deleteAction}>
              <input type="hidden" name="photoId" value={photo.id} />
              <button
                type="submit"
                disabled={deletePending}
                className="rounded p-1 bg-black/60 text-red-400 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors"
                title="Delete photo"
              >
                <Trash2 size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Caption editor */}
      {isEditingCaption && (
        <div className="absolute inset-0 rounded-lg bg-black/80 flex items-center justify-center p-3">
          <form
            action={(formData) => {
              captionAction(formData)
              onCancelCaption()
            }}
            className="w-full space-y-2"
          >
            <input type="hidden" name="photoId" value={photo.id} />
            <textarea
              name="caption"
              defaultValue={photo.caption || ''}
              placeholder="Add a caption..."
              rows={3}
              autoFocus
              className="w-full rounded-md bg-zinc-800 border border-zinc-600 px-2 py-1 text-xs text-white placeholder-zinc-400 focus:border-amber-500 focus:outline-none resize-none"
            />
            <div className="flex gap-1 justify-end">
              <button
                type="button"
                onClick={onCancelCaption}
                className="rounded p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
              <button
                type="submit"
                disabled={captionPending}
                className="rounded p-1 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
              >
                <Check size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info bar */}
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {photo.filename}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 ml-1">
          {formatBytes(photo.size)}
        </p>
      </div>
      {photo.caption && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
          {photo.caption}
        </p>
      )}
    </div>
  )
}
