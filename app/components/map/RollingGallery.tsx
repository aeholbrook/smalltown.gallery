'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import type { GalleryPreview } from '@/lib/gallery'

interface RollingGalleryProps {
  previews: GalleryPreview[]
  direction?: 'up' | 'down'
}

export default function RollingGallery({ previews, direction = 'up' }: RollingGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || previews.length === 0) return

    const speed = 0.5 // pixels per frame

    function animate() {
      if (!el || pausedRef.current) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      if (direction === 'up') {
        el.scrollTop += speed
        // Reset when we've scrolled through the first set (seamless loop)
        if (el.scrollTop >= el.scrollHeight / 2) {
          el.scrollTop = 0
        }
      } else {
        el.scrollTop -= speed
        if (el.scrollTop <= 0) {
          el.scrollTop = el.scrollHeight / 2
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start scrolled at the right position for "down" direction
    if (direction === 'down') {
      el.scrollTop = el.scrollHeight / 2
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationRef.current)
  }, [previews, direction])

  if (previews.length === 0) return null

  // Double the items for seamless looping
  const items = [...previews, ...previews]

  return (
    <div
      className="rolling-gallery h-full overflow-hidden"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div ref={scrollRef} className="h-full overflow-hidden scrollbar-hide">
        <div className="flex flex-col gap-3 p-2">
          {items.map((preview, i) => (
            <Link
              key={`${preview.townSlug}-${preview.photo.filename}-${i}`}
              href={`/towns/${preview.townSlug}/${preview.year}`}
              className="group block flex-shrink-0"
            >
              <div className="overflow-hidden rounded-lg">
                <img
                  src={preview.photo.src}
                  alt={`${preview.townName} — ${preview.photographer}`}
                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="mt-1.5 px-0.5">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">
                  {preview.townName}
                </h4>
                <p className="text-[11px] text-zinc-500">
                  {preview.year} — {preview.photographer}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
