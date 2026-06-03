/* HERO — "Ideas into reality."
   Signature white-serif-on-blue with an animated grid. On load: header logo
   scales in, the headline masks up line-by-line, subline + CTAs fade up. On
   scroll: grid parallaxes and the content lifts/fades — the moment into the
   next section. GSAP owns this timeline + scroll; Framer owns nothing here so
   the two never fight over transforms. */

import { useRef } from 'react'
import { gsap, useGSAP, EASE_GSAP, DURATION, prefersReducedMotion } from '../../lib/animation'
import Logo from '../ui/Logo'
import StartProjectButton from '../ui/StartProjectButton'
import GridBackground from '../ui/GridBackground'

export default function Hero() {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const reduce = prefersReducedMotion()
      const q = gsap.utils.selector(root)

      if (reduce) {
        gsap.set(q('.hero-anim'), { opacity: 1, y: 0 })
        gsap.set(q('.hero-line-inner'), { yPercent: 0, opacity: 1 })
        gsap.set(q('.hero-logo'), { opacity: 1, scale: 1 })
        return
      }

      // ---- Entrance timeline -------------------------------------------
      const tl = gsap.timeline({ defaults: { ease: EASE_GSAP } })

      tl.from('.hero-mark', { opacity: 0, duration: 1, ease: 'none' }, 0)
        .from('.hero-logo', { opacity: 0, scale: 0.82, duration: DURATION.slow }, 0)
        .from('.hero-kicker', { opacity: 0, y: 16, duration: DURATION.base }, 0.15)
        .from(
          '.hero-line-inner',
          { yPercent: 130, duration: DURATION.slow, stagger: 0.12 },
          0.25,
        )
        .from('.hero-sub', { opacity: 0, y: 22, duration: DURATION.base }, 0.65)
        .from('.hero-cta', { opacity: 0, y: 22, duration: DURATION.base }, 0.78)

      // ---- Scroll signature moment (scrubbed parallax, no pin) ----------
      gsap.to('.hero-grid', {
        yPercent: 16,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero-mark img', {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero-content', {
        yPercent: -8,
        opacity: 0.55,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: root },
  )

  return (
    <section
      ref={root}
      id="hero"
      data-theme="brand"
      className="relative isolate flex min-h-dvh flex-col overflow-hidden"
      style={{ background: 'var(--blue-700)' }}
    >
      <GridBackground className="hero-grid" opacity={0.06} cell={64} />

      {/* slim header — its bottom edge marks the top of the hero's centered area */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6 lg:px-10">
        <span className="hero-logo">
          <Logo tone="light" size="lg" />
        </span>
        <span className="hero-anim hidden sm:block">
          <StartProjectButton variant="on-blue" />
        </span>
      </header>

      {/* centered area — everything below the header. Both the ghosted mark and
          the hero text center vertically within THIS region, so the mark sits at
          the region's middle (not the full section's). */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* ghosted brand mark — right-middle of the hero: seated in the right
            gutter, vertically centered in the region. */}
        <div
          className="hero-mark pointer-events-none absolute left-[80%] top-1/2 z-0 hidden w-max -translate-x-1/2 -translate-y-1/2 md:block lg:left-[76%]"
          aria-hidden
        >
          <img
            src="/brand/logo-source-cropped.png"
            alt=""
            style={{ width: 'clamp(300px, 30vw, 520px)', height: 'auto', maxWidth: 'none', opacity: 0.05, willChange: 'transform' }}
          />
        </div>

        {/* hero content — centered horizontally (same left edge as the header)
            and vertically within the region */}
        <div className="hero-content relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-10 sm:px-8 lg:px-10">
          <p
            className="hero-kicker df-kicker"
            style={{
              color: 'rgba(255,255,255,.7)',
              fontSize: 'clamp(10.5px, 2.4vw, 12.5px)',
              letterSpacing: '0.18em',
              marginBottom: 'clamp(22px, 3.4vw, 34px)',
            }}
          >
            AI Videos · Websites
          </p>

          <h1
            className="max-w-[16ch]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 'clamp(3.25rem, 12.5vw, 8.25rem)',
              lineHeight: 0.9,
              letterSpacing: '-0.025em',
              color: 'var(--white)',
            }}
          >
            <span className="block overflow-hidden pt-[0.06em] pb-[0.2em] -mt-[0.06em] -mb-[0.2em]">
              <span className="hero-line-inner block">Ideas into</span>
            </span>
            <span className="block overflow-hidden pt-[0.06em] pb-[0.2em] -mt-[0.06em] -mb-[0.2em]">
              <span className="hero-line-inner block">
                <span className="df-em">reality.</span>
              </span>
            </span>
          </h1>

          <p
            className="hero-sub df-lead max-w-[42ch]"
            style={{
              color: 'var(--blue-100)',
              marginTop: 'clamp(24px,3.5vw,34px)',
              fontSize: 'clamp(1.125rem, 2.2vw, 1.4375rem)',
            }}
          >
            AI-generated videos and custom websites for founders who want to be seen.
          </p>

          <div className="hero-cta mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <StartProjectButton variant="on-blue" />
            <a
              href="#work"
              className="font-mono text-[13px] uppercase tracking-[0.18em] text-blue-100 underline-offset-8 transition-colors hover:text-snow hover:underline"
            >
              View work
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
