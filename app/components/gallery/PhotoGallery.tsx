'use client'

import { useRef } from 'react'
import type { GalleryPhoto } from '@/lib/gallery'
import { Lightbox } from './Lightbox'

interface PhotoGalleryProps {
  photos: GalleryPhoto[]
  townName: string
}

export function PhotoGallery({ photos, townName }: PhotoGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">
        {photos.length} photograph{photos.length !== 1 ? 's' : ''}
      </p>

      <div
        ref={galleryRef}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {photos.map((photo, index) => (
          <a
            key={photo.filename}
            href={photo.src}
            data-pswp-width={1600}
            data-pswp-height={1200}
            className="group relative aspect-[4/3] overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={photo.src}
              alt={`${townName} photograph ${index + 1}`}
              loading={index < 10 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </a>
        ))}
      </div>

      <Lightbox galleryRef={galleryRef} />
    </div>
  )
}
