/* Back-to-top — a fixed, round button anchored to the bottom-right. It fades in
   once you've scrolled past the first screen and smooth-scrolls to the top
   (GSAP ScrollToPlugin via `smoothScrollTo`, so it animates through the site's
   ScrollTrigger pins; reduced-motion falls back to an instant jump). Sized for
   thumbs and kept clear of the screen edge on small viewports. */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { smoothScrollTo } from '../../lib/animation'

export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // Portalled to <body> so it sits OUTSIDE #smooth-content. ScrollSmoother
  // transforms that element, which would otherwise break this button's
  // `position: fixed` (a transformed ancestor becomes the containing block).
  return createPortal(
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => smoothScrollTo(0)}
      className={`fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-blue-700 text-snow shadow-[var(--shadow-3)] ring-1 ring-white/15 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:bottom-6 sm:right-6 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 19V5M6 11l6-6 6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>,
    document.body,
  )
}
