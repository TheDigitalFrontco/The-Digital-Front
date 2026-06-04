/* THE PROCESS — pinned horizontal steps, swept RIGHT→LEFT (the exact opposite
   of What We Build: the track starts shifted left and slides right as you scroll,
   so panels travel left→right and you read intro → 01 → 02 → 03 → 04).
   Between consecutive step cards hangs a "string": an SVG line driven by a damped
   spring that's kicked by scroll velocity — scroll fast and the strings sag/whip,
   stop and they ease back to taut. Mobile / reduced-motion: a clean vertical stack
   with a connecting rail (no pin, no physics). */

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../../lib/animation'
import { Reveal, RevealItem } from '../ui/Reveal'
import ScrollCue from '../ui/ScrollCue'

interface Step {
  index: string
  title: string
  lead: string
  body: string
}

const STEPS: Step[] = [
  {
    index: '01',
    title: 'Brief',
    lead: 'We listen first.',
    body:
      "A quick conversation to understand what you're building, whether video, web, or both, plus your company, your goals, and your budget. Have an idea? Great. Don't? We'll shape one together.",
  },
  {
    index: '02',
    title: 'Direction',
    lead: 'We shape the vision.',
    body:
      "We align before we create. You approve the script and stills for video, or a layout direction for your site. Nothing moves forward until it's right, with no surprises later.",
  },
  {
    index: '03',
    title: 'Build',
    lead: 'We bring it to life.',
    body:
      "We bring it to life, and you shape it as we go. For websites: review and refine until it's yours. For video: you sign off on the direction before we produce, with small tweaks always welcome and the big strokes locked once the media's made.",
  },
  {
    index: '04',
    title: 'Handover',
    lead: 'We hand you the keys.',
    body:
      'Everything, delivered and finished. Videos in full quality, ready to post. Websites handed over complete, with your domain, your accounts, your files. All yours.',
  },
]

/* Base amount of vertical scroll it takes to traverse the track (mirrors What We
   Build). On big screens the sweep is stretched further — see scrollFactor(). */
const SCROLL_FACTOR = 1.45
/* Upper end of that stretch, reached at WIDE_AT and beyond. */
const SCROLL_FACTOR_WIDE = 1.9
const WIDE_AT = 2560 // px; the width where the sweep hits its longest pace
const WIDE_FROM = 1700 // px; below this (laptops, tablets) the base pace is kept

/* ---- A single physics "string" between two panels ------------------------ */

/** Per-string spring state. Under-damped so it visibly wobbles before settling. */
interface StringState {
  pos: number // current vertical offset of the curve, in viewBox units (line sits at 50)
  vel: number // velocity of that offset
  k: number // stiffness — pull back to taut
  c: number // damping — how fast the wobble dies
  sign: number // alternate sag direction so adjacent strings read as a wave
  drawn: number // last `pos` written to the DOM — lets us skip no-op repaints
}

function StepCard({ step }: { step: Step }) {
  // Above 1920px the card keeps growing with the viewport (the `min-[1920px]:`
  // width) instead of staying pinned at the 460px `md:` cap. Without it the track
  // stops widening on big monitors, the horizontal overflow shrinks to almost
  // nothing, and the pinned sweep finishes in a single scroll. The wide width is
  // marked important (`!`) because Tailwind v4 emits arbitrary `min-[…]` variants
  // *before* named breakpoints, so the `md:` rule would otherwise win the cascade.
  // The 460px floor matches the md cap, so widths at/below 1920px are unchanged.
  return (
    <article
      className="group relative flex flex-none flex-col overflow-hidden rounded-[2px] border border-grey-200 bg-snow p-7 shadow-[var(--shadow-1)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[var(--shadow-2)] sm:p-9
                 w-full
                 motion-safe:h-[max(58svh,28rem)] motion-safe:w-[82vw] motion-safe:sm:w-[56vw] motion-safe:md:h-[max(56vh,28rem)] motion-safe:md:w-[clamp(340px,40vw,460px)] motion-safe:min-[1920px]:w-[clamp(460px,23vw,680px)]!"
    >
      {/* giant ghosted index — the card's focal graphic, deepens on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-1 top-[32%] -translate-y-1/2 select-none text-[5.5rem] leading-none text-blue-100 transition-colors duration-500 group-hover:text-blue-200 sm:text-[8rem] md:text-[11rem]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.05em',
        }}
      >
        {step.index}
      </span>

      {/* content sits above the number */}
      <div className="relative z-10 flex flex-1 flex-col">
        <div>
          <span className="font-mono text-[12.5px] font-medium uppercase tracking-[0.22em] text-blue-500">
            {step.lead}
          </span>
          {/* accent rule — extends on hover */}
          <span
            aria-hidden
            className="mt-3 block h-px w-8 bg-blue-300 transition-all duration-300 group-hover:w-14"
          />
        </div>

        <h3
          className="mt-auto"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(2rem, 4vw, 2.875rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.018em',
            color: 'var(--blue-950)',
          }}
        >
          {step.title}
        </h3>

        {/* min-h is only a baseline floor; a layout effect in Process() grows every
          card's body to match the tallest one, so all four titles land at the same
          spot at any viewport width and whichever font has finished loading. */}
      <p className="df-body mt-4 max-w-[42ch] min-h-[140px]">{step.body}</p>
      </div>
    </article>
  )
}

/** A connector cell that holds one wobbling string. Width = the gap between cards. */
function StringConnector({ pathRef }: { pathRef: (el: SVGPathElement | null) => void }) {
  return (
    <div
      aria-hidden
      className="relative hidden flex-none self-stretch motion-safe:block
                 motion-safe:w-[clamp(56px,7vw,120px)] motion-safe:min-[1920px]:w-[clamp(120px,6vw,200px)]"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ willChange: 'transform' }}
      >
        <path
          ref={pathRef}
          d="M0,50 C33,50 66,50 100,50"
          fill="none"
          stroke="var(--blue-400)"
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

export default function Process() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const paths = useRef<SVGPathElement[]>([])
  const setPath = (i: number) => (el: SVGPathElement | null) => {
    if (el) paths.current[i] = el
  }

  // Keep every step card's title on the same line as its neighbours'. Because
  // mt-auto pushes the title down by however tall its body is, a card whose body
  // wraps to an extra line — step 03, at narrower card widths, under OS display
  // scaling (e.g. Windows 150%), or before the web font loads — shoves its title
  // up out of alignment. Measure the tallest body and grow the rest to match,
  // re-running whenever the section resizes and once fonts settle so the row
  // stays aligned in any environment. Skipped under reduced motion, where the
  // cards stack vertically and never sit side by side.
  useEffect(() => {
    const root = section.current
    if (!root) return
    let frame = 0
    const equalize = () => {
      if (prefersReducedMotion()) return
      const bodies = [
        ...root.querySelectorAll<HTMLParagraphElement>('article p.df-body'),
      ].filter((p) => p.offsetParent !== null) // only the visible (horizontal) set
      if (!bodies.length) return
      bodies.forEach((p) => (p.style.minHeight = '')) // reset, then measure natural height
      const tallest = bodies.reduce((m, p) => Math.max(m, p.offsetHeight), 0)
      bodies.forEach((p) => (p.style.minHeight = `${tallest}px`))
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(equalize)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(root) // fires on mount and on any later size change (viewport, zoom, OS scaling)
    document.fonts?.ready.then(schedule).catch(() => {})
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [])

  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      if (reduce) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const el = track.current
        if (!el) return
        const amount = () => Math.max(0, el.scrollWidth - window.innerWidth)
        // Big PC monitors get a longer, more gradual sweep: the pin's scroll
        // distance stretches with viewport width — base pace at ≤WIDE_FROM
        // (laptops/tablets), easing up to SCROLL_FACTOR_WIDE at WIDE_AT and beyond.
        // Re-read on every refresh (invalidateOnRefresh), so it tracks resizes.
        const scrollFactor = () =>
          gsap.utils.clamp(
            SCROLL_FACTOR,
            SCROLL_FACTOR_WIDE,
            gsap.utils.mapRange(WIDE_FROM, WIDE_AT, SCROLL_FACTOR, SCROLL_FACTOR_WIDE, window.innerWidth),
          )

        // Opposite of What We Build: start shifted left (-amount), slide to 0.
        // The sweep spans the WHOLE pinned scroll — no start/end "holds". Those
        // held the first/last card motionless at the edges while you were already
        // pinned, which reads as a sticky, "magnetic" catch on the way in and out;
        // without them the sweep responds the instant the pin engages.
        const tl = gsap.timeline()
        tl.fromTo(el, { x: () => -amount() }, { x: 0, ease: 'none', duration: 1 })

        // Latest scroll velocity (px/s), decayed every frame so a stop lets the
        // springs oscillate back instead of holding a sag.
        let scrollVel = 0

        const st = ScrollTrigger.create({
          trigger: section.current,
          start: 'top top',
          end: () => '+=' + amount() * scrollFactor(),
          pin: true,
          scrub: 0.6, // small lerp so the wheel feels smooth without lagging past the pin edges
          animation: tl,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scrollVel = self.getVelocity()
          },
        })

        // Only run the per-frame string physics while the section is on screen.
        // Otherwise the ticker below burns main-thread time recomputing springs
        // and re-pathing 3 SVGs every frame for the whole rest of the page.
        let visible = false
        const visST = ScrollTrigger.create({
          trigger: section.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            visible = self.isActive
          },
        })
        visible = visST.isActive

        // One spring per string. Slight per-string variation + alternating sign
        // so the row of strings reads as an organic wave, not a rubber stamp.
        const strings: StringState[] = paths.current.map((_, i) => ({
          pos: 0,
          vel: 0,
          k: 90 + (i % 3) * 10, // spring pull back to taut
          c: 20 + (i % 2) * 1.5, // ~critical damping → eases back with no rebound
          sign: i % 2 === 0 ? 1 : -1, // adjacent strings sag opposite ways → a gentle wave
          drawn: NaN, // forces the first frame to draw
        }))

        // Sag force, gentled on touch devices — phones AND iPads alike — where fast
        // flick-scrolls would otherwise whip the strings too hard. Keyed on pointer
        // type, not width, so even a wide iPad (e.g. 1366px in landscape) is treated
        // like a phone, not a desktop. Mouse/trackpad screens keep the full push.
        // Re-evaluated on resize (cheap; also covers a pointer being added/removed).
        let gain = 0.0038 // viewBox units of sag per px/s of scroll velocity
        let maxSag = 14 // clamp so the curve never reaches the card edges
        const tuneForce = () => {
          const touch = window.matchMedia('(pointer: coarse)').matches
          gain = touch ? 0.0006 : 0.0038
          maxSag = touch ? 3 : 14
        }
        tuneForce()
        window.addEventListener('resize', tuneForce)

        const tick = (_t: number, deltaMs: number) => {
          if (!visible) return // section off-screen → skip the physics entirely
          const dt = Math.min(deltaMs / 1000, 1 / 30) // clamp dt on slow frames
          scrollVel *= 0.83 // decay stale velocity quickly so the sag doesn't linger

          for (let i = 0; i < strings.length; i++) {
            const s = strings[i]
            let target = scrollVel * gain * s.sign
            if (target > maxSag) target = maxSag
            else if (target < -maxSag) target = -maxSag
            const accel = -s.k * (s.pos - target) - s.c * s.vel
            s.vel += accel * dt
            s.pos += s.vel * dt

            const p = paths.current[i]
            if (!p) continue
            // Skip the DOM write when the curve hasn't visibly moved. A taut /
            // settled string then costs nothing instead of re-pathing an SVG every
            // frame — which, inside the track's layer, forced per-frame repaints.
            if (Math.abs(s.pos - s.drawn) < 0.02) continue
            s.drawn = s.pos
            const y1 = 50 + s.pos
            const y2 = 50 + s.pos * 0.82 // trailing control point → rope-like S curve
            p.setAttribute('d', `M0,50 C33,${y1.toFixed(2)} 66,${y2.toFixed(2)} 100,50`)
          }
        }

        gsap.ticker.add(tick)

        return () => {
          gsap.ticker.remove(tick)
          window.removeEventListener('resize', tuneForce)
          st.kill()
          visST.kill()
        }
      })

      // Touch: normalize scroll so the pin stays smooth (same as What We Build).
      mm.add('(pointer: coarse) and (prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.normalizeScroll(true)
        return () => ScrollTrigger.normalizeScroll(false)
      })

      return () => mm.revert()
    },
    { scope: section },
  )

  // Intro panel + the 4 step cards, in reading order.
  const intro = (
    <div
      key="intro"
      className="flex w-full flex-none flex-col justify-center
                 motion-safe:h-[max(58svh,28rem)] motion-safe:w-[82vw] motion-safe:sm:w-[56vw] motion-safe:md:h-[max(56vh,28rem)] motion-safe:md:w-[clamp(300px,30vw,420px)] motion-safe:min-[1920px]:w-[clamp(420px,21vw,560px)]!"
    >
      <p className="df-kicker">03 — How we work</p>
      <h2
        className="mt-5"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: 'var(--blue-950)',
          textWrap: 'balance',
        }}
      >
        Simple, by <span className="df-em">design.</span>
      </h2>
      <ScrollCue tone="on-light" />
    </div>
  )

  const stepCards = STEPS.map((s) => <StepCard key={s.index} step={s} />)

  // Strings hang only BETWEEN consecutive step cards (01–02, 02–03, 03–04).
  // The intro → 01 gap is a plain spacer — a rope off the borderless intro
  // panel read as connecting to nothing.
  const GAP = 'hidden flex-none self-stretch motion-safe:block motion-safe:w-[clamp(56px,7vw,120px)] motion-safe:min-[1920px]:w-[clamp(120px,6vw,200px)]'
  const withStrings: React.ReactNode[] = [intro, <div key="introgap" aria-hidden className={GAP} />]
  stepCards.forEach((card, i) => {
    if (i > 0) withStrings.push(<StringConnector key={`s${i}`} pathRef={setPath(i - 1)} />)
    withStrings.push(card)
  })

  // The track sweeps right→left, so lay panels out reversed: 04 sits leftmost,
  // intro rightmost. Starting shifted left then sliding to 0 reveals intro→04.
  withStrings.reverse()

  return (
    <section ref={section} id="process" className="relative overflow-hidden bg-snow">
      {/* faint dot texture, used with restraint */}
      <div aria-hidden className="df-texture-dots pointer-events-none absolute inset-0 opacity-50" />

      {/* MOTION-SAFE: pinned horizontal track. REDUCED: vertical stack. */}
      <div
        ref={track}
        className="relative flex flex-col gap-6 px-5 py-24 sm:px-8 sm:py-28
                   motion-safe:h-dvh motion-safe:flex-row motion-safe:items-center motion-safe:gap-0 motion-safe:py-0 motion-safe:md:px-10 motion-safe:will-change-transform"
      >
        {/* In the reduced/vertical view we want natural reading order + a rail. */}
        <div className="contents motion-safe:hidden">
          {intro}
          <ol className="mt-12 flex flex-col gap-5 border-l border-grey-200 pl-6">
            {STEPS.map((s) => (
              <Reveal key={s.index} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-snow"
                />
                <RevealItem>
                  <StepCard step={s} />
                </RevealItem>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* The pinned horizontal sequence (cards + physics strings). */}
        <div className="hidden motion-safe:contents">{withStrings}</div>
      </div>
    </section>
  )
}
