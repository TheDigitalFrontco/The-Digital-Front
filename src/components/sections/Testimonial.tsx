/* TESTIMONIAL — a smooth auto-rotating set of client quotes.
   One quote shows at a time; as each enters, its words illuminate left-to-right
   (the signature reveal); leaving quotes lift + fade. A clickable progress bar
   fills over the interval and advances; hover/focus pauses it. A giant faint
   quote mark drifts behind on scroll (GSAP parallax). Reduced-motion: no
   autoplay, instant full-brightness quote, dots to navigate.

   GSAP owns the scroll parallax; Framer owns the rotation/entrance (component
   state) — so the two never fight over transforms. */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap, ScrollTrigger, useGSAP, EASE, prefersReducedMotion } from '../../lib/animation'

interface Token {
  t: string
  em?: boolean
}

interface Quote {
  tokens: Token[]
  /** Optional attribution shown small + italic after the quote (e.g. a translation marker). */
  note?: string
}

/* Wrap an emphasised phrase in {curly braces}; it renders as italic serif. */
function toTokens(s: string): Token[] {
  const out: Token[] = []
  for (const part of s.split(/(\{[^}]*\})/g).filter(Boolean)) {
    const em = part.startsWith('{') && part.endsWith('}')
    const text = em ? part.slice(1, -1) : part
    for (const w of text.split(/\s+/).filter(Boolean)) out.push({ t: w, em })
  }
  return out
}

const QUOTES: Quote[] = [
  { tokens: toTokens("Wow, it looks so good! {Thank you so much,} you've been such a great help."), note: 'Translated' },
  { tokens: toTokens('You did that with AI? {No way!} It looks so real. I love it!') },
  { tokens: toTokens('Yes, they turned out great. Excited for our {future projects} together.') },
]

const INTERVAL = 3000 // ms each quote holds before advancing

// How long after the pointer goes still we resume auto-rotating. We pause on
// pointer MOVEMENT (the visitor reading), not on mouseenter: on desktop,
// ScrollSmoother glides the whole card up under a resting cursor via a CSS
// transform, which fires mouseenter with no user input at all — that used to
// latch `paused` on and freeze the carousel (and its progress bar) on the first
// quote until the cursor was moved away. Keying off movement + an idle resume
// guarantees a stationary cursor (scrolled-under, or simply parked over the
// card) can never stall the rotation. Touch is unaffected — mouse events don't
// fire there, which is why the bug never showed on mobile.
const RESUME_AFTER_IDLE = 1500 // ms of pointer stillness before rotation resumes

export default function Testimonial() {
  const section = useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = prefersReducedMotion()

  // Hover pause (pointer devices). Pause while the cursor is actively moving over
  // the card, and resume once it has been still for a beat — see RESUME_AFTER_IDLE
  // for why this keys off movement rather than mouseenter. clearTimeout on every
  // move keeps re-arming the resume so the pause holds while you read.
  const resumeTimer = useRef<number | undefined>(undefined)
  const pauseWhileMoving = () => {
    setPaused(true)
    window.clearTimeout(resumeTimer.current)
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_AFTER_IDLE)
  }
  const resumeNow = () => {
    window.clearTimeout(resumeTimer.current)
    setPaused(false)
  }
  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  // `inView` gates the reveal + autoplay so the word-by-word illumination plays
  // when the visitor reaches "Kind words", not off-screen below the fold. It's
  // driven by GSAP ScrollTrigger rather than an IntersectionObserver: it shares
  // the same scroll engine that pins the sections above, resolves the section's
  // position reliably, and fires at a definite scroll point — instead of an
  // intersection ratio that a near-full-height section can stop just short of,
  // which left the quote sitting dim ("in view but never loaded").
  const [inView, setInView] = useState(false)
  // Latched: once revealed, stay lit — don't re-dim each time the section
  // re-crosses the trigger while scrolling.
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (inView) setStarted(true)
  }, [inView])

  useGSAP(
    () => {
      // Reduced motion: no parallax, no autoplay — just show the quote and its
      // attribution at full brightness immediately.
      if (prefersReducedMotion()) {
        setStarted(true)
        return
      }

      // Giant quotation mark drifts up as you pass — parallax depth.
      gsap.to('.tw-mark', {
        yPercent: -16,
        ease: 'none',
        scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })

      // Reveal + autoplay gate: active once the section has scrolled a quarter of
      // the way up the viewport (so the quote lights up before it's centred) and
      // stays active until it has mostly scrolled past. onRefresh seeds the initial
      // state, covering a load that's already parked in the section.
      const st = ScrollTrigger.create({
        trigger: section.current,
        start: 'top 75%',
        end: 'bottom 25%',
        onToggle: (self) => setInView(self.isActive),
        onRefresh: (self) => setInView(self.isActive),
      })
      return () => st.kill()
    },
    { scope: section },
  )

  // Autoplay — a timer is the source of truth (the progress bar's animationend can
  // stall in a backgrounded tab and silently halt the carousel). It runs only
  // while the section is in view, so the rotation begins when the visitor reaches
  // "Kind words" rather than cycling unseen below the fold. Re-arms on every index
  // change; pauses on hover/focus and whenever the section scrolls away; off under
  // reduced motion.
  useEffect(() => {
    if (reduce || paused || !inView) return
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % QUOTES.length), INTERVAL)
    return () => window.clearTimeout(id)
  }, [index, paused, reduce, inView])

  const card = {
    initial: {},
    animate: { transition: { staggerChildren: reduce ? 0 : 0.04, delayChildren: reduce ? 0 : 0.12 } },
    exit: { opacity: 0, y: reduce ? 0 : -14, transition: { duration: reduce ? 0.001 : 0.4, ease: EASE } },
  }
  const word = {
    initial: { opacity: reduce ? 1 : 0.16 },
    animate: { opacity: 1, transition: { duration: reduce ? 0.001 : 0.5, ease: EASE } },
  }
  // Trailing attribution (e.g. "(Translated)") — fades to a dim, subordinate state.
  const noteReveal = {
    initial: { opacity: 0 },
    animate: { opacity: 0.5, transition: { duration: reduce ? 0.001 : 0.5, ease: EASE } },
  }

  const quote = QUOTES[index]

  return (
    <section ref={section} id="testimonial" data-theme="dark" className="relative overflow-hidden bg-blue-950">
      {/* faint dot texture (white on dark, via --texture) */}
      <div aria-hidden className="df-texture-dots pointer-events-none absolute inset-0 opacity-60" />

      {/* giant drifting quotation mark — depth behind the quote */}
      <span
        aria-hidden
        className="tw-mark pointer-events-none absolute left-[1%] top-[2%] z-0 select-none leading-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(14rem, 40vw, 32rem)',
          color: 'rgba(255,255,255,0.055)',
          willChange: 'transform',
        }}
      >
        &ldquo;
      </span>

      <figure
        className="relative z-10 mx-auto flex min-h-[78vh] max-w-4xl flex-col items-center justify-center px-5 py-28 text-center sm:px-8 sm:py-36"
        onMouseMove={pauseWhileMoving}
        onMouseLeave={resumeNow}
        onFocusCapture={() => {
          window.clearTimeout(resumeTimer.current)
          setPaused(true)
        }}
        onBlurCapture={resumeNow}
        aria-roledescription="carousel"
        aria-label="Client testimonials"
      >
        <p className="df-kicker">04 — Kind words</p>

        {/* rotating quote — one at a time, crossfaded */}
        <div className="mt-7 flex min-h-[clamp(220px,34vh,340px)] w-full items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={index} variants={card} initial="initial" animate={started ? 'animate' : 'initial'} exit="exit">
              <blockquote
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                  fontSize: 'clamp(1.625rem, 3.8vw, 2.875rem)',
                  lineHeight: 1.3,
                  letterSpacing: '-0.015em',
                  color: 'var(--white)',
                  textWrap: 'balance',
                }}
              >
                {quote.tokens.map((w, i) => (
                  <motion.span key={i} variants={word} className={w.em ? 'df-em' : undefined}>
                    {w.t}{' '}
                  </motion.span>
                ))}
                {quote.note && (
                  <motion.span
                    variants={noteReveal}
                    className="df-em"
                    style={{
                      display: 'inline-block',
                      marginLeft: '0.1em',
                      fontSize: '0.42em',
                      letterSpacing: 'normal',
                      verticalAlign: 'middle',
                    }}
                  >
                    ({quote.note})
                  </motion.span>
                )}
              </blockquote>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* progress bars — fill over the interval, click to jump */}
        <div className="mt-12 flex items-center gap-2.5">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show testimonial ${i + 1} of ${QUOTES.length}`}
              aria-current={i === index}
              className="relative h-[3px] w-8 overflow-hidden rounded-full bg-white/15 transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
            >
              {i === index &&
                (reduce ? (
                  <span className="absolute inset-0 rounded-full bg-white/70" />
                ) : (
                  <span
                    key={index}
                    className="absolute inset-0 origin-left rounded-full bg-white/75"
                    style={{
                      animationName: 'tw-progress',
                      animationDuration: `${INTERVAL}ms`,
                      animationTimingFunction: 'linear',
                      animationFillMode: 'forwards',
                      animationPlayState: paused || !inView ? 'paused' : 'running',
                    }}
                  />
                ))}
            </button>
          ))}
        </div>
      </figure>
    </section>
  )
}
