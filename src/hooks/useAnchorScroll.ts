/* Keep the address bar clean. In-page anchor links (href="#work", "#services"…)
   normally make the browser write that fragment into the URL. This hook
   intercepts those clicks and smooth-scrolls to the target itself via GSAP's
   ScrollToPlugin (`smoothScrollTo`) — which animates reliably even through the
   ScrollTrigger pins + normalizeScroll this site uses, where the native CSS
   `scroll-behavior: smooth` would otherwise jump instantly. The hash is never
   pushed to the URL. It also strips any fragment that arrives on the initial
   load, so the bar always shows just the site URL. Non-hash links (mailto:,
   https://, social) are ignored, and reduced-motion falls back to an instant
   jump (handled inside `smoothScrollTo`). */

import { useEffect } from 'react'
import { smoothScrollTo } from '../lib/animation'

export function useAnchorScroll() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // leave modifier / non-primary clicks alone (open-in-new-tab, etc.)
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return
      }

      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      if (!link) return

      const id = link.getAttribute('href')?.slice(1)
      if (!id) return

      const target = document.getElementById(id)
      if (!target) return

      // Smooth-scroll there ourselves and swallow the default — so no #hash is
      // written and the motion animates (vs. the native instant jump).
      e.preventDefault()
      smoothScrollTo(target)
    }

    document.addEventListener('click', onClick)

    // Clean any fragment that came in with the initial URL.
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    // Always (re)open at the very top. This site's pinned scroll animations don't
    // restore cleanly to a mid-page position, and the hero is designed to play
    // from the start — so we turn off the browser's scroll restoration and reset
    // to the top on load. (An in-progress contact form is preserved separately,
    // so nothing is lost by starting fresh here.)
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)

    return () => document.removeEventListener('click', onClick)
  }, [])
}
