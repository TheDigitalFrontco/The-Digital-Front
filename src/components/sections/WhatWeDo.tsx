/* WHAT WE DO — two pillars on a light ground. Each card: a mono label over an
   italic-serif title, a one-line description, then a list of offerings whose
   check-marks stroke themselves in as the card scrolls up. A giant ghosted index
   numeral sits behind the content as the card's focal graphic (echoing the
   Process step cards) and drifts on scroll — a scrubbed GSAP parallax, the same
   trick as the Testimonial quote-mark — for depth. Brand card = hairline border
   + faint shadow, sharp corners; hover lifts it, warms the border to blue,
   deepens the numeral, and extends the accent rule. Two columns on desktop,
   stacked on mobile.

   GSAP owns the scroll choreography (the numeral parallax + the check-mark draw,
   both reliable under ScrollSmoother); Framer owns the card entrance, hover, and
   the staggered row fade — so the two never fight over a transform. */

import { useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Reveal, RevealItem } from '../ui/Reveal'
import {
  staggerParent,
  fadeUp,
  inView,
  EASE,
  EASE_GSAP,
  DURATION,
  prefersReducedMotion,
  gsap,
  ScrollTrigger,
  useGSAP,
} from '../../lib/animation'

interface Pillar {
  index: string
  category: string
  title: ReactNode
  description: string
  offerings: string[]
}

const PILLARS: Pillar[] = [
  {
    index: '01',
    category: 'Content',
    title: (
      <>
        Stories, <span className="df-em">told.</span>
      </>
    ),
    description:
      'Scroll-stopping AI-generated content that makes founders impossible to ignore.',
    offerings: [
      'AI-generated videos & reels',
      'Short-form content for Instagram, TikTok & Facebook',
      'UGC-style content',
      'Carousels & static posts',
      'Content calendars & strategy',
      'One-off projects or monthly retainers',
    ],
  },
  {
    index: '02',
    category: 'Websites',
    title: (
      <>
        Sites, <span className="df-em">finished.</span>
      </>
    ),
    description:
      'Fully customizable websites, plus Shopify and WordPress builds, beautiful, fast, and ready to convert.',
    offerings: [
      'Single-page & multi-page websites',
      'Custom animated front-end (Signature work)',
      'Shopify stores',
      'WordPress sites',
      'Fully responsive & built to convert',
      'Connected, live, and ready',
    ],
  },
]

/* Catch the eye on the one offering that names our signature — a custom animated
   front-end is literally what this whole site is. */
function renderOffering(item: string): ReactNode {
  const marker = '(Signature work)'
  const at = item.indexOf(marker)
  if (at === -1) return item
  return (
    <>
      {item.slice(0, at)}
      <span className="font-medium text-blue-500">{marker}</span>
    </>
  )
}

/* The path carries `.df-check-path`; WhatWeDo's useGSAP hides it (dash-offset)
   and draws it in when the card scrolls up. Plain stroke-dash draw — no premium
   plugin — driven by GSAP because SVG scroll choreography is unreliable through
   Framer's whileInView under ScrollSmoother (the smoother moves content by
   transform, so IntersectionObserver doesn't cleanly drive a path reveal). */
function CheckMark() {
  return (
    <span aria-hidden className="mt-[3px] flex-none text-blue-500">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          className="df-check-path"
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

// The recoloured paint splatter spans both cards: the SAME image is dropped into
// each, biased onto card 1, so card 1 carries the body and card 2 the flecks that
// "reached" it. Each card clips its own part (overflow-hidden) and the gutter slice
// between them is hidden — so it shows only on the cards, never in the gap.
// Art: /public/work/paint-splatter.png (506×493), recoloured via a CSS alpha mask.
const SPLASH_W = 309 // +3%
const SPLASH_H = Math.round(((SPLASH_W * 493) / 506) * 0.975) // ~2.5% flatter than source
const GUTTER_HALF = 12 // px — half the cards' md gap (gap-6 = 24px)
const SPLASH_BIAS = 36 // px — how far left of the gutter midline the splatter centres (onto card 1); smaller → further right

/* The blue paint splash, recoloured from the real splatter PNG via a CSS mask: a
   brand-blue fill is shown only through the image's alpha (its shape). The same
   splash is placed in both cards — biased onto card 1 — and each card clips its own
   part, so the two halves form one splash that never shows in the gutter. Desktop
   only (md+); the stacked layout has no shared side-edge to bridge. */
function PaintSplash({ side }: { side: 'left' | 'right' }) {
  // Both cards place the splatter at the SAME point relative to the gutter, so the
  // two clipped parts line up into one continuous splash.
  const place =
    side === 'right'
      ? { right: 0 as const, transform: `translate(calc(50% + ${GUTTER_HALF - SPLASH_BIAS}px), -50%)` }
      : { left: 0 as const, transform: `translate(calc(-50% - ${GUTTER_HALF + SPLASH_BIAS}px), -50%)` }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 z-0 hidden select-none md:block"
      style={{ width: SPLASH_W, height: SPLASH_H, ...place }}
    >
      {/* The recoloured splatter. WhatWeDo's useGSAP "splats" it in — scaling + fading
          up from this element's centre (the shared impact point, the same world spot
          in both cards) so the two clipped halves land as one throw. The 0.62 here is
          the resting opacity GSAP animates up to, and what shows as-is under reduced
          motion (where the splash simply appears, no animation). */}
      <div
        className="df-splash-fill h-full w-full"
        style={{
          backgroundImage: 'linear-gradient(135deg, #5b79a6, #3f587f)',
          opacity: 0.62,
          WebkitMaskImage: 'url(/work/paint-splatter.png)',
          maskImage: 'url(/work/paint-splatter.png)',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />
    </div>
  )
}

function PillarCard({ pillar, splash }: { pillar: Pillar; splash?: 'left' | 'right' }) {
  const reduce = prefersReducedMotion()

  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -6 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
      className="df-pillar-card group relative flex h-full flex-col overflow-hidden rounded-[2px] border border-grey-200 bg-snow p-7 shadow-[var(--shadow-1)] transition-[box-shadow,border-color] duration-300 hover:border-blue-200 hover:shadow-[var(--shadow-2)] sm:p-9"
    >
      {/* giant ghosted index — the card's focal graphic; deepens on hover and
          drifts on scroll (parallax wired in WhatWeDo's useGSAP below) */}
      <span
        aria-hidden
        className="df-pillar-index pointer-events-none absolute right-3 top-5 z-0 select-none text-[5.5rem] leading-none text-blue-100 transition-colors duration-500 group-hover:text-blue-200 sm:text-[7rem] md:text-[8.5rem]"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          letterSpacing: '-0.05em',
          willChange: 'transform',
        }}
      >
        {pillar.index}
      </span>

      {/* blue paint that splashed across from card 1 onto card 2 (md+ only) */}
      {splash && <PaintSplash side={splash} />}

      {/* content sits above the numeral */}
      <div className="relative z-10 flex h-full flex-col">
        <div>
          <span className="font-mono text-[12.5px] font-medium uppercase tracking-[0.22em] text-blue-500">
            {pillar.category}
          </span>
          {/* accent rule — extends on hover */}
          <span
            aria-hidden
            className="mt-3 block h-px w-8 bg-blue-300 transition-all duration-300 group-hover:w-14"
          />
        </div>

        <h3
          className="mt-8"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 'clamp(1.75rem, 3.2vw, 2.375rem)',
            lineHeight: 1.04,
            letterSpacing: '-0.018em',
            color: 'var(--blue-950)',
          }}
        >
          {pillar.title}
        </h3>

        <p className="df-body mt-4 max-w-[40ch]">{pillar.description}</p>

        {/* offerings — each row fades up (Framer) while its check-mark draws (GSAP) */}
        <motion.ul
          className="mt-7 flex flex-col gap-3 border-t border-grey-200 pt-6"
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={inView}
        >
          {pillar.offerings.map((item) => (
            <motion.li key={item} variants={fadeUp} className="flex items-start gap-3">
              <CheckMark />
              <span className="font-sans text-[15px] leading-snug text-grey-700">
                {renderOffering(item)}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.article>
  )
}

export default function WhatWeDo() {
  const section = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      // Reduced motion: leave the numerals parked and the check-marks fully drawn
      // (we never hide them), so nothing animates.
      if (prefersReducedMotion()) return

      // Ghosted numerals drift as the section passes — a scrubbed parallax welded
      // to scroll position (no autoplay, no overshoot), like the Testimonial mark.
      const nums = section.current?.querySelectorAll<HTMLElement>('.df-pillar-index')
      nums?.forEach((el, i) => {
        gsap.to(el, {
          yPercent: i % 2 ? -10 : -18, // adjacent cards drift unequally → a gentle, non-mechanical feel
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      })

      // Each card's check-marks stroke themselves in (stroke-dash draw) as the card
      // scrolls up, staggered down the list.
      section.current?.querySelectorAll<HTMLElement>('.df-pillar-card').forEach((card) => {
        const checks = card.querySelectorAll<SVGPathElement>('.df-check-path')
        checks.forEach((p) => {
          const len = p.getTotalLength()
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
        })
        gsap.to(checks, {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: EASE_GSAP,
          stagger: 0.08,
          scrollTrigger: { trigger: card, start: 'top 78%', once: true },
        })
      })

      // Splash: scales + fades up from its shared impact point (both card-halves land
      // as one throw). Two triggers keep "play" and "hide" independent: it re-splats
      // every time the splash scrolls into view (either direction), and only resets to
      // hidden once the WHOLE section has left the viewport — so it never blinks out
      // while still partly on screen. The tween is paused and driven by the triggers.
      const splash = gsap.fromTo(
        '.df-splash-fill',
        { scale: 0.4, opacity: 0 },
        {
          scale: 1,
          opacity: 0.62,
          duration: 0.9,
          ease: 'power3.out',
          transformOrigin: '50% 50%',
          paused: true,
        },
      )
      // Re-throw whenever the splash itself scrolls into view, from either direction.
      const splashEl = section.current?.querySelector('.df-splash-fill')
      if (splashEl) {
        const playST = ScrollTrigger.create({
          trigger: splashEl,
          start: 'top bottom',
          end: 'bottom top',
          onEnter: () => splash.restart(),
          onEnterBack: () => splash.restart(),
        })
        if (playST.isActive) splash.restart() // already in view on load → splat now
      }
      // Hide only once the section is COMPLETELY out of view (off the top or bottom).
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top bottom',
        end: 'bottom top',
        onLeave: () => splash.pause(0),
        onLeaveBack: () => splash.pause(0),
      })
    },
    { scope: section },
  )

  return (
    <section ref={section} id="services" className="relative overflow-hidden bg-grey-50">
      {/* faint dot texture in the section's negative space (matches Process) */}
      <div aria-hidden className="df-texture-dots pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <Reveal className="max-w-[30ch]">
          <RevealItem>
            <p className="df-kicker">01 — What we do</p>
          </RevealItem>
          <RevealItem>
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
              Two things, done <span className="df-em">exceptionally.</span>
            </h2>
          </RevealItem>
        </Reveal>

        <Reveal className="mt-12 grid grid-cols-1 gap-5 sm:mt-16 md:grid-cols-2 md:gap-6">
          {PILLARS.map((p, i) => (
            <RevealItem key={p.index} className="h-full">
              <PillarCard pillar={p} splash={i === 0 ? 'right' : i === 1 ? 'left' : undefined} />
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
