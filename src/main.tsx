import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ScrollSmoother, prefersReducedMotion } from './lib/animation'

// We restore the last-viewed section ourselves on reload (see
// useScrollRestoration); take scroll restoration off the browser as early as
// possible so it can't flash the previous position through ScrollSmoother first.
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

// Page-wide smooth (lerped) scrolling — the buttery vertical feel, and what
// glides you in and out of the pinned horizontal sections instead of the pin
// "catching" your scroll.
//
// It MUST be created before React mounts the sections: the sections' pinned
// ScrollTriggers have to register against the smoother (pinType "transform"),
// and a pin created before the smoother exists collapses (loses its sweep
// distance). So the #smooth-wrapper/#smooth-content live in index.html and we
// create the smoother here, synchronously, ahead of createRoot().render().
//
// Created for touch too (reduced-motion still keeps plain scrolling). On touch we
// add a light `smoothTouch` lerp so ScrollSmoother owns ALL scrolling — it glides
// the pinned sweeps AND smooths general vertical scroll. This replaces the raw
// per-section `normalizeScroll(true)`, which kept the pins synced but forced the
// whole page's scroll onto the main thread, leaving mobile *vertical* scrolling
// juddery (desktop was unaffected). `smoothTouch` is the dial: raise it for more
// glide, lower it (toward 0) for snappier, more native-feeling touch.
if (!prefersReducedMotion() && !ScrollSmoother.get()) {
  ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2, // desktop lerp (seconds to "catch up")
    smoothTouch: 0.1, // touch lerp (seconds) — smooths mobile vertical scrolling
    effects: false,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
