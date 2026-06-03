import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ScrollSmoother, prefersReducedMotion } from './lib/animation'

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
// Pointer devices only: touch keeps native momentum (already smooth) plus the
// sections' own normalizeScroll, and reduced-motion keeps plain scrolling. When
// it's not created, the wrapper divs are inert and scrolling is normal.
if (
  !prefersReducedMotion() &&
  !window.matchMedia('(pointer: coarse)').matches &&
  !ScrollSmoother.get()
) {
  ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2, // seconds to "catch up" to the scroll — the smoothness dial
    effects: false,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
