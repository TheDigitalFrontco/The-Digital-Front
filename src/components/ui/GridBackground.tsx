/* Animated digital-texture grid for blue surfaces. White hairlines at ≤7%
   contrast (per brand), softly masked toward the edges so it reads as
   structure, not noise. Slow continuous drift + optional scroll parallax,
   driven on transform only for 60fps. */

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/animation'

interface GridBackgroundProps {
  /** grid cell size in px */
  cell?: number
  /** line opacity 0–1 */
  opacity?: number
  className?: string
}

export default function GridBackground({
  cell = 64,
  opacity = 0.06,
  className = '',
}: GridBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      // Slow, barely-there drift — mechanical and calm, never floaty. Driven on
      // TRANSFORM (translate), not background-position: the tile repeats every
      // `cell`px, so translating one cell looks identical but is GPU-composited
      // (no per-frame full-surface repaint, which tanked scroll FPS).
      gsap.to(ref.current, {
        x: cell,
        y: cell,
        duration: 18,
        ease: 'none',
        repeat: -1,
      })
    },
    { scope: ref },
  )

  const line = `rgba(255,255,255,${opacity})`

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        // double radial mask: fades the grid out toward the edges
        WebkitMaskImage:
          'radial-gradient(120% 120% at 50% 30%, #000 35%, transparent 78%)',
        maskImage: 'radial-gradient(120% 120% at 50% 30%, #000 35%, transparent 78%)',
      }}
    >
      <div
        ref={ref}
        // Overhang ≥ the drift distance (one cell) on every side so translating
        // by `cell` never exposes an uncovered edge, even on narrow phones.
        className="absolute inset-[-80px]"
        style={{
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          willChange: 'transform',
        }}
      />
    </div>
  )
}
