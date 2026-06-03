/* Magnetic hover: the element eases toward the cursor while hovered, then
   returns home on leave. GSAP quickTo owns the transform (so it never fights
   Framer Motion). Disabled for touch pointers and reduced-motion. */

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/animation'

export function useMagnetic<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) return
      // Only magnetise for fine pointers (mouse), not touch.
      if (!window.matchMedia('(pointer: fine)').matches) return

      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })

      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        const relX = e.clientX - (rect.left + rect.width / 2)
        const relY = e.clientY - (rect.top + rect.height / 2)
        xTo(relX * strength)
        yTo(relY * strength)
      }
      const onLeave = () => {
        xTo(0)
        yTo(0)
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: ref },
  )

  return ref
}
