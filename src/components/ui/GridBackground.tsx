/* Animated digital-texture grid for blue surfaces. White hairlines at ≤7%
   contrast (per brand), softly masked toward the edges so it reads as
   structure, not noise. Slow continuous drift + optional scroll parallax,
   driven on transform only for 60fps.

   On touch (pointer:coarse) the grid is rendered STATIC and UNMASKED: a weak
   mobile GPU shouldn't spend frames re-compositing a full-bleed masked layer as
   it drifts/parallaxes (a real mobile scroll cost), and the texture is subtle
   enough to read fine edge-to-edge. Desktop keeps the masked drift. */

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/animation'

interface GridBackgroundProps {
  /** grid cell size in px */
  cell?: number
  /** line opacity 0–1 */
  opacity?: number
  className?: string
}

const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export default function GridBackground({
  cell = 64,
  opacity = 0.06,
  className = '',
}: GridBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // Static on touch (see file header) and under reduced motion.
      if (prefersReducedMotion() || COARSE) return
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
  // The radial mask is a per-frame re-composite while the grid moves — fine on a
  // desktop GPU, costly on mobile, so it's desktop-only.
  const mask = COARSE
    ? undefined
    : 'radial-gradient(120% 120% at 50% 30%, #000 35%, transparent 78%)'

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <div
        ref={ref}
        // Overhang ≥ the drift distance (one cell) on every side so translating
        // by `cell` never exposes an uncovered edge, even on narrow phones.
        className="absolute inset-[-80px]"
        style={{
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px`,
          willChange: COARSE ? undefined : 'transform',
        }}
      />
    </div>
  )
}
