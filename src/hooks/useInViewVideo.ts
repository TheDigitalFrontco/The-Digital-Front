/* Autoplay muted/looped filmstrip videos while in view; pause when they leave.
   IntersectionObserver keeps off-screen tiles from burning battery/FPS.

   Desktop (pointer:fine): every in-view clip plays — unchanged.
   Touch (pointer:coarse): only the SINGLE most-visible clip plays at a time, so a
   weak mobile GPU never decodes several videos at once while the pinned filmstrip
   sweeps — the main mobile scroll stutter. The rest hold their current frame and
   resume as they become the most-visible tile.

   Respects prefers-reduced-motion (no autoplay — poster/last frame only). Returns
   a ref to attach to a <video>; a no-op when no video element is mounted. */

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/animation'

const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

// Touch-only coordinator: shared across tiles so they agree on the one to play.
const ratios = new Map<HTMLVideoElement, number>()
let raf = 0
function reconcile() {
  raf = 0
  let best: HTMLVideoElement | null = null
  let bestRatio = 0.15 // must be at least this visible to be worth decoding
  ratios.forEach((ratio, v) => {
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = v
    }
  })
  ratios.forEach((_, v) => {
    if (v === best) {
      if (v.paused) void v.play().catch(() => {})
    } else if (!v.paused) {
      v.pause()
    }
  })
}
function schedule() {
  if (!raf) raf = requestAnimationFrame(reconcile)
}

export function useInViewVideo<T extends HTMLVideoElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || prefersReducedMotion()) return

    // Desktop: each clip plays whenever it's in view (original behaviour).
    if (!COARSE) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) void video.play().catch(() => {})
            else video.pause()
          }
        },
        { threshold: 0.35 },
      )
      io.observe(video)
      return () => io.disconnect()
    }

    // Touch: feed the coordinator, which plays only the most-visible clip.
    ratios.set(video, 0)
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target as HTMLVideoElement, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        schedule()
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    )
    io.observe(video)
    return () => {
      io.disconnect()
      ratios.delete(video)
      if (!video.paused) video.pause()
      schedule()
    }
  }, [])

  return ref
}
