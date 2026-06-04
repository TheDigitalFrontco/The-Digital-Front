/* Autoplay a muted/looped video while it's in view; pause when it leaves.
   IntersectionObserver keeps off-screen tiles from burning battery/FPS. Every
   in-view clip plays (the filmstrip's combined weight is small). Respects
   prefers-reduced-motion (no autoplay — poster only). Returns a ref to attach to
   a <video>; a no-op when no video element is mounted. */

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/animation'

export function useInViewVideo<T extends HTMLVideoElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || prefersReducedMotion()) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void video.play().catch(() => {})
          } else {
            video.pause()
          }
        }
      },
      { threshold: 0.35 },
    )

    io.observe(video)
    return () => io.disconnect()
  }, [])

  return ref
}
