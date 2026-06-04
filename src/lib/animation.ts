/* ============================================================================
   THE DIGITAL FRONT — Shared animation config.
   One source of truth so GSAP (scroll timelines) and Framer Motion
   (component states) share the same rhythm: calm, confident, never bouncy.

   Brand motion rules (from the design system):
   - Easing: cubic-bezier(.22,.61,.36,1) ease-out
   - Durations: 0.4–0.7s. Fades, precise slides, mask/clip reveals.
   - No bounce, no spring overshoot, no spin.
   - Respect prefers-reduced-motion. Animate transform/opacity only (60fps).
   ========================================================================== */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { CustomEase } from 'gsap/CustomEase'
import { useGSAP } from '@gsap/react'
import type { Transition, Variants } from 'framer-motion'

/* Register plugins once, on the client. */
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother, CustomEase, useGSAP)

// A mobile browser showing/hiding its address bar resizes the viewport, which
// would otherwise fire a ScrollTrigger refresh mid-scroll and hitch the pinned
// sweeps. Ignore that resize — the pinned heights use svh/dvh and already cope.
ScrollTrigger.config({ ignoreMobileResize: true })

/* ---- Tokens -------------------------------------------------------------- */

/** Brand ease-out as a cubic-bezier array — for Framer Motion transitions. */
export const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1]

/** The exact same curve registered as a named GSAP ease (CustomEase). */
CustomEase.create('df-ease', 'M0,0 C0.22,0.61 0.36,1 1,1')
/** GSAP ease name matching the brand curve. */
export const EASE_GSAP = 'df-ease'

export const DURATION = {
  fast: 0.4,
  base: 0.55,
  slow: 0.7,
} as const

/** Stagger between children on a reveal (seconds). */
export const STAGGER = 0.08

/* ---- Reduced motion ------------------------------------------------------ */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/* ---- Framer Motion variants ---------------------------------------------- */

const reduce = prefersReducedMotion()

const baseTransition: Transition = {
  duration: reduce ? 0.001 : DURATION.base,
  ease: EASE,
}

/** Container that staggers its children's reveal. */
export const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: reduce ? 0 : STAGGER,
      delayChildren: 0.05,
    },
  },
}

/** Child fades up into place. Pairs with `staggerParent`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: reduce ? 0 : 24 },
  show: { opacity: 1, y: 0, transition: baseTransition },
}

/** Subtle fade-in with no travel — for large/heavy elements. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: baseTransition },
}

/** Mask/clip reveal — text or image wipes up into view. */
export const clipReveal: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(100% 0 0 0)', y: reduce ? 0 : 12 },
  show: {
    opacity: 1,
    clipPath: 'inset(0% 0 0 0)',
    y: 0,
    transition: { duration: reduce ? 0.001 : DURATION.slow, ease: EASE },
  },
}

/** Standard viewport trigger for Framer `whileInView` — reveal once. */
export const inView = {
  once: true,
  amount: 0.3,
  margin: '0px 0px -10% 0px',
} as const

/* ---- Hover / press (component states) ------------------------------------ */

export const cardHover = {
  rest: { y: 0, transition: baseTransition },
  hover: { y: reduce ? 0 : -6, transition: { duration: DURATION.fast, ease: EASE } },
}

export const pressScale = reduce ? 1 : 0.985

/* ---- GSAP helpers -------------------------------------------------------- */

/** Smoothly scroll the window to a target — an element, selector, or a Y offset
 *  (use 0 for the top). Driven by GSAP's ScrollToPlugin so it cooperates with
 *  ScrollTrigger pins and normalizeScroll (where native `scroll-behavior` is
 *  hijacked and would otherwise jump instantly). Reduced-motion falls back to an
 *  instant jump.
 *
 *  NB: no `autoKill` — with ScrollTrigger pins active, ScrollTrigger nudges the
 *  scroll position between ticks, which autoKill misreads as a manual scroll and
 *  kills the tween on its second frame (leaving it stuck at the start). Letting
 *  the tween run to completion is the reliable behaviour here. */
export function smoothScrollTo(target: Element | string | number) {
  if (reduce) {
    if (typeof target === 'number') {
      window.scrollTo(0, target)
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target
      el?.scrollIntoView({ block: 'start' })
    }
    return
  }

  // A PINNED section (What we build, How we work) can't be located by its DOM
  // position: once you've scrolled past it, ScrollTrigger parks the pinned
  // element at the END of its scroll span, so scrolling to the element would
  // land on the LAST frame. When the target is the trigger of a pinned
  // ScrollTrigger, scroll to that trigger's pin `start` instead — always the
  // FIRST frame, whichever direction you approach from.
  let y: Element | string | number = target
  if (target instanceof Element) {
    const pinned = ScrollTrigger.getAll().find(
      (st) =>
        !!st.pin &&
        (st.trigger === target || (st.trigger instanceof Element && st.trigger.contains(target))),
    )
    if (pinned) y = pinned.start
  }

  // When ScrollSmoother is active (pointer devices) it owns scrolling — animate
  // through it so the lerp stays intact; a raw window scrollTo would fight it.
  // Numbers are absolute positions; elements align to the top of the viewport.
  const smoother = ScrollSmoother.get()
  if (smoother) {
    smoother.scrollTo(y, true, typeof y === 'number' ? undefined : 'top top')
    return
  }

  gsap.to(window, {
    duration: 0.9,
    ease: EASE_GSAP,
    scrollTo: { y },
    overwrite: 'auto',
  })
}

/** A scroll-scrubbed fade-up for a set of elements (transform/opacity only). */
export function scrollFadeUp(
  targets: gsap.TweenTarget,
  trigger: Element,
  opts: { start?: string; stagger?: number } = {},
) {
  if (reduce) {
    gsap.set(targets, { opacity: 1, y: 0 })
    return
  }
  return gsap.from(targets, {
    opacity: 0,
    y: 28,
    duration: DURATION.base,
    ease: EASE_GSAP,
    stagger: opts.stagger ?? STAGGER,
    scrollTrigger: {
      trigger,
      start: opts.start ?? 'top 80%',
      toggleActions: 'play none none reverse',
    },
  })
}

export { gsap, ScrollTrigger, ScrollSmoother, useGSAP }
