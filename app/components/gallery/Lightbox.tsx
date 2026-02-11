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

    lightbox.on('uiRegister', () => {
      lightbox.pswp?.ui?.registerElement({
        name: 'custom-caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        html: '',
        onInit: (el, pswp) => {
          const updateCaption = () => {
            const currSlideElement = pswp.currSlide?.data.element as HTMLElement | undefined
            const caption = currSlideElement?.getAttribute('data-pswp-caption')?.trim() || ''
            if (caption) {
              el.innerHTML = caption
              el.classList.remove('pswp__custom-caption--empty')
            } else {
              el.innerHTML = ''
              el.classList.add('pswp__custom-caption--empty')
            }
          }

          pswp.on('change', updateCaption)
          updateCaption()
        },
      })
    })

    lightbox.init()

    return () => {
      lightbox.destroy()
    }
  }, [galleryRef])

  return null
}
