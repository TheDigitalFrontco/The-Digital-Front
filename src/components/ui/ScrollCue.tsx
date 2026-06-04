/* SCROLL CUE — a quiet, centered "keep going" hint under a section title.
   Used on the pinned 02 (What We Build) and 03 (Process) intros, whose title
   panel greets you on entry then sweeps away as you scroll. Subordinate to the
   kicker + headline: a small mono label centered over a thin DOUBLE-ENDED
   vertical arrow that drifts gently up/down (frozen to a static arrow under
   reduced motion by the global rule in index.css).

   It centers under the HEADLINE's text — not the wider left-aligned panel — by
   measuring the title that sits right above it, and re-measures on resize / once
   the display font loads, so it stays centered and in proportion at any screen
   size. `tone` flips it for dark vs. light backgrounds. */

import { useLayoutEffect, useRef, useState } from 'react'

type ScrollCueTone = 'on-dark' | 'on-light'

export default function ScrollCue({
  tone = 'on-light',
  label = 'Scroll',
  className = '',
}: {
  tone?: ScrollCueTone
  label?: string
  className?: string
}) {
  // Muted so it never competes with the headline — sits at the section kicker's
  // weight: a soft white on dark, the blue-500 anchor on light.
  const color = tone === 'on-dark' ? 'rgba(255,255,255,.6)' : 'var(--blue-500)'
  const ref = useRef<HTMLDivElement>(null)
  const [titleW, setTitleW] = useState<number>()

  // Match our width to the headline directly above us, so "centered" reads as
  // centered under the TITLE rather than the (wider) panel it lives in.
  useLayoutEffect(() => {
    const title = ref.current?.previousElementSibling
    if (!title) return
    const measure = () => {
      const range = document.createRange()
      range.selectNodeContents(title)
      const w = range.getBoundingClientRect().width
      if (w) setTitleW(w)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(title)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className={`flex flex-col items-center gap-1.5 self-start text-center ${className}`}
      style={{
        color,
        marginTop: 'clamp(20px, 3.2vw, 36px)',
        width: titleW ? `${titleW}px` : undefined,
        maxWidth: '100%',
      }}
    >
      <span
        className="font-mono uppercase"
        style={{ fontSize: 'clamp(9px, 0.5vw + 6px, 10.5px)', letterSpacing: '0.22em', textIndent: '0.11em' }}
      >
        {label}
      </span>
      <svg
        className="df-scroll-cue-arrow"
        viewBox="0 0 12 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 'clamp(10px, 1.1vw, 12px)', height: 'auto' }}
      >
        {/* top head — points up */}
        <path d="M2.5 6 L6 2 L9.5 6" />
        {/* shaft */}
        <line x1="6" y1="2.5" x2="6" y2="23.5" />
        {/* bottom head — points down */}
        <path d="M2.5 20 L6 24 L9.5 20" />
      </svg>
    </div>
  )
}
