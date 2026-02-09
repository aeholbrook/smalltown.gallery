'use client'

import { useEffect, type RefObject } from 'react'
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import 'photoswipe/style.css'

interface LightboxProps {
  galleryRef: RefObject<HTMLDivElement | null>
}

export function Lightbox({ galleryRef }: LightboxProps) {
  useEffect(() => {
    if (!galleryRef.current) return

    const lightbox = new PhotoSwipeLightbox({
      gallery: galleryRef.current,
      children: 'a[data-pswp-width]',
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.95,
      showHideAnimationType: 'zoom',
      paddingFn: () => ({ top: 40, bottom: 40, left: 20, right: 20 }),
    })

    lightbox.init()

    return () => {
      lightbox.destroy()
    }
  }, [galleryRef])

  return null
}
