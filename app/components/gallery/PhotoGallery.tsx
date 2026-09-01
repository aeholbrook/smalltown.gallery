'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { GalleryPhoto } from '@/lib/gallery'
import { Lightbox } from './Lightbox'

interface PhotoGalleryProps {
  photos: GalleryPhoto[]
  townName: string
}

export function PhotoGallery({ photos, townName }: PhotoGalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return

    const cleanup: Array<() => void> = []
    // Only photos with unknown stored dimensions fall back to measuring the
    // rendered image; measured sizes reflect the optimized variant, so photos
    // with real DB dimensions must not be overwritten here.
    const anchors = Array.from(gallery.querySelectorAll('a[data-pswp-auto]'))

    for (const anchor of anchors) {
      const img = anchor.querySelector('img')
      if (!img) continue

      const setNaturalSize = () => {
        if (!img.naturalWidth || !img.naturalHeight) return
        anchor.setAttribute('data-pswp-width', String(img.naturalWidth))
        anchor.setAttribute('data-pswp-height', String(img.naturalHeight))
      }

      if (img.complete) {
        setNaturalSize()
      } else {
        const onLoad = () => setNaturalSize()
        img.addEventListener('load', onLoad)
        cleanup.push(() => img.removeEventListener('load', onLoad))
      }
    }

    return () => {
      for (const fn of cleanup) fn()
    }
  }, [photos])

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500">
        {photos.length} photograph{photos.length !== 1 ? 's' : ''}
      </p>

      <div
        ref={galleryRef}
        className="columns-2 gap-2 sm:columns-3 md:columns-4 lg:columns-5"
      >
        {photos.map((photo, index) => (
          <a
            key={photo.src}
            href={photo.src}
            data-pswp-width={photo.width || 1600}
            data-pswp-height={photo.height || 1200}
            data-pswp-auto={photo.width ? undefined : ''}
            data-pswp-caption={photo.title?.trim() || undefined}
            className="group relative mb-2 block overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"
            target="_blank"
            rel="noreferrer"
          >
            <Image
              src={photo.src}
              alt={photo.title || `${townName} photograph ${index + 1}`}
              width={photo.width || 1600}
              height={photo.height || 1200}
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={index < 4}
              className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
            />
            {photo.title && (
              <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.title}
              </span>
            )}
          </a>
        ))}
      </div>

      <Lightbox galleryRef={galleryRef} />
    </div>
  )
}
