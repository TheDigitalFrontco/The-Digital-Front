/* WHAT WE BUILD — pinned horizontal showcase (a glimpse of the range).
   Desktop (motion-safe): the section pins and the track scrolls sideways as you
   scroll down. Tiles take each clip's NATIVE aspect ratio (set per-project) and
   are sized to FIT INSIDE the viewport box — capped at the sweep height on wide
   screens, and at ~88vw on narrow phones so a wide clip shrinks to fit instead
   of overflowing off-screen (see `.work-tile` in index.css). Result: every clip
   shows fully, edge-to-edge — no bars, no crop — as a mixed-aspect filmstrip.
   Each tile has a wired media slot: a `.gif` src renders as <img>, anything
   else as an autoplaying muted <video>. Until a real asset is dropped in, a
   labelled placeholder shows. Hover: media zooms ~5%. */

import { useRef, type CSSProperties } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../../lib/animation'

/* How much vertical scroll it takes to traverse the horizontal track. */
const SCROLL_FACTOR = 1.45
import { useInViewVideo } from '../../hooks/useInViewVideo'
import StartProjectButton from '../ui/StartProjectButton'
import ScrollCue from '../ui/ScrollCue'

interface Project {
  id: string
  /** label shown next to the index, e.g. "AI Video" / "Website" */
  label: string
  /** internal reference + media alt text */
  title: string
  /** controls the play glyph on the placeholder */
  type: 'Video' | 'Site'
  /** the clip's NATIVE aspect ratio as width ÷ height (e.g. 1024 / 576). Drives
   *  the tile's shape AND its fit-to-viewport sizing, so the whole clip shows on
   *  every screen. If you swap in a file of a different shape, update this. */
  ar: number
  /** the media element to use: a gif renders as <img>, a video as <video> */
  media: 'video' | 'gif'
  tint: string
  /** Drop a real file path here to swap the placeholder for live media. */
  src?: string
  poster?: string
}

/* Media lives in /public/work and is served from /work/*. `ar` is each clip's
   native width÷height — it shapes the tile and drives the fit-to-viewport sizing
   so the whole clip stays visible on every screen. The values below match the
   supplied files; replace a file of the same shape freely, or update `ar` if a
   new file's proportions differ. */
const PROJECTS: Project[] = [
  { id: '01', label: 'AI Video', title: 'AI video — horizontal', type: 'Video', ar: 1024 / 576, media: 'video', src: '/work/ai-horizontal.mp4', tint: 'var(--blue-700)' },
  { id: '02', label: 'Website', title: 'Website — wide', type: 'Site', ar: 2558 / 1266, media: 'video', src: '/work/website-horizontal.mp4', tint: 'var(--blue-900)' },
  { id: '03', label: 'Website', title: 'Website — compact', type: 'Site', ar: 800 / 582, media: 'video', src: '/work/website-vertical.mp4', tint: 'var(--blue-800)' },
  // The one tall, vertical clip — sits last in the row, and stands alone (not stacked) on phones.
  { id: '04', label: 'AI Video', title: 'AI video — vertical', type: 'Video', ar: 464 / 832, media: 'video', src: '/work/ai-vertical.mp4', tint: 'var(--blue-600)' },
]

const gridImage =
  'linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)'

/* Sizing lives in `.work-tile` (index.css): in the sweep the tile is fit to the
   viewport box at its --ar so the whole clip shows; reduced-motion falls back to
   a plain full-width tile. The aspect ratio (--ar + aspect-ratio) is applied
   inline per-project below. */
const TILE_BASE =
  'work-tile work-reveal group relative flex-none overflow-hidden rounded-[2px] ' +
  'w-full motion-safe:w-auto'

function PlayGlyph() {
  return (
    <span
      aria-hidden
      className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/40"
    >
      <span
        className="ml-1 block h-0 w-0"
        style={{
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderLeft: '11px solid rgba(255,255,255,.85)',
        }}
      />
    </span>
  )
}

function WorkTile({ p }: { p: Project }) {
  const videoRef = useInViewVideo<HTMLVideoElement>()
  return (
    <article className={TILE_BASE} style={{ '--ar': p.ar, aspectRatio: p.ar } as CSSProperties}>
      {/* media (zooms on hover; tile clips it) */}
      <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]">
        {p.src ? (
          p.media === 'gif' ? (
            <img src={p.src} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              src={p.src}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="metadata"
              poster={p.poster}
              aria-label={p.title}
            />
          )
        ) : (
          <div className="absolute inset-0" style={{ background: p.tint }}>
            <div
              className="work-grid absolute inset-0"
              style={{ backgroundImage: gridImage, backgroundSize: '40px 40px' }}
            />
            <div className="absolute inset-0 grid place-items-center px-5 text-center">
              <div>
                {p.type === 'Video' && (
                  <div className="mb-5">
                    <PlayGlyph />
                  </div>
                )}
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/55">
                  Placeholder
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
                  Drop your {p.media} here
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* legibility scrims — top keeps the index label readable over light video
          frames; bottom grounds the clip with a subtle vignette. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%]"
        style={{ background: 'linear-gradient(to bottom, rgba(16,22,29,.64), rgba(16,22,29,.14) 60%, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: 'linear-gradient(to top, rgba(20,27,34,.62), transparent)' }}
      />

      {/* index + label */}
      <span
        className="absolute left-5 top-5 z-10 font-mono text-[11px] uppercase tracking-[0.18em] text-white/85"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,.6)' }}
      >
        {p.id} — {p.label}
      </span>
    </article>
  )
}

export default function WhatWeBuild() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const reduce = prefersReducedMotion()

      // keep placeholder grids subtly alive — but only when a placeholder is
      // actually on screen. A project with a real `src` renders <video>/<img>
      // instead of the `.work-grid` fallback, so guard against an empty match;
      // otherwise GSAP logs "target .work-grid not found" on every load.
      if (!reduce) {
        const grids = section.current?.querySelectorAll('.work-grid')
        if (grids && grids.length) {
          gsap.to(grids, {
            backgroundPosition: '40px 40px',
            duration: 16,
            ease: 'none',
            repeat: -1,
          })
        }
      }

      const mm = gsap.matchMedia()

      // Horizontal pin + scrub on every screen size when motion is allowed.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = track.current
        if (!el) return
        const amount = () => Math.max(0, el.scrollWidth - window.innerWidth)
        // The track sweeps across the WHOLE pinned scroll — no start/end "holds".
        // Those held the first/last tile motionless at the edges while you were
        // already pinned, which reads as a sticky, "magnetic" catch on the way in
        // and out; without them the sweep responds the instant the pin engages.
        const tl = gsap.timeline()
        tl.to(el, { x: () => -amount(), ease: 'none', duration: 1 })
        const st = ScrollTrigger.create({
          trigger: section.current,
          start: 'top top',
          end: () => '+=' + amount() * SCROLL_FACTOR,
          pin: true,
          scrub: 0.6, // small lerp so the wheel feels smooth without lagging past the pin edges
          animation: tl,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        })
        return () => st.kill()
      })

      // Touch scrolling (incl. keeping this pin synced) is owned by ScrollSmoother's
      // smoothTouch now — see main.tsx. No separate normalizeScroll here.
      return () => mm.revert()
    },
    { scope: section },
  )

  return (
    <section
      ref={section}
      id="work"
      data-theme="dark"
      className="relative bg-blue-950 motion-safe:h-dvh motion-safe:overflow-hidden"
    >
      <div
        ref={track}
        className="flex flex-col gap-5 px-5 py-24 sm:px-8 sm:py-28 motion-safe:h-full motion-safe:flex-row motion-safe:items-center motion-safe:gap-5 motion-safe:py-0 motion-safe:min-[1025px]:gap-6 motion-safe:min-[1025px]:px-10 motion-safe:will-change-transform"
      >
        {/* intro panel */}
        <div className="work-reveal flex w-full flex-none flex-col justify-center motion-safe:h-[64svh] motion-safe:w-[82vw] motion-safe:sm:w-[60vw] motion-safe:min-[1025px]:h-[62vh] motion-safe:md:w-[clamp(300px,30vw,420px)]">
          <p className="df-kicker">02 — What we build</p>
          <h2
            className="mt-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              color: 'var(--white)',
              textWrap: 'balance',
            }}
          >
            A glimpse of the <span className="df-em">range.</span>
          </h2>
          <ScrollCue tone="on-dark" />
        </div>

        {/* 01, 02, 03 are the shorter, wider clips. On phones they stack into a
            single column so the trio fills the vertical space; the one tall
            vertical clip (04) stands alone beside them. At md+ this wrapper
            dissolves (display:contents) so all four sit in the flat filmstrip row. */}
        <div className="work-stack flex flex-none flex-col items-center gap-5 min-[1025px]:contents">
          <WorkTile p={PROJECTS[0]} />
          <WorkTile p={PROJECTS[1]} />
          <WorkTile p={PROJECTS[2]} />
        </div>
        <WorkTile p={PROJECTS[3]} />

        {/* end CTA panel */}
        <div className="work-reveal flex w-full flex-none flex-col justify-center rounded-[2px] border border-white/15 p-7 sm:p-9 motion-safe:h-[64svh] motion-safe:w-[82vw] motion-safe:sm:w-[60vw] motion-safe:min-[1025px]:h-[62vh] motion-safe:md:w-[clamp(300px,28vw,400px)]">
          <p className="df-kicker">Next</p>
          <h3
            className="mt-4"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(1.75rem, 3.2vw, 2.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.018em',
              color: 'var(--white)',
            }}
          >
            Your project <span className="df-em">here.</span>
          </h3>
          <p className="df-body mt-4 max-w-[30ch]" style={{ color: 'var(--blue-200)' }}>
            Have something in mind? Let's build the front.
          </p>
          <div className="mt-7">
            <StartProjectButton variant="on-blue" />
          </div>
        </div>
      </div>
    </section>
  )
}
