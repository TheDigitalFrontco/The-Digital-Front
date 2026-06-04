/* Keep your place across reloads. The site opens at the very top for a fresh
   visit, but a *refresh* should leave you on the SAME section you were reading —
   on every device.

   We can't lean on the browser's native scroll restoration here: with
   ScrollSmoother (pointer devices) and the two pinned horizontal sweeps, a raw
   restored scrollY lands mid-pin and renders wrong — which is exactly why
   restoration used to be turned off and every load snapped to the top.

   So instead we remember the section in view (sessionStorage, per-tab) and, on
   load, jump straight to that section's first frame:
   - pin-aware: a pinned section (work / process) is reached at its ScrollTrigger
     `start`, not its DOM position (which maps to the END of the sweep);
   - engine-aware: through ScrollSmoother when it's active, else native scroll
     (touch + reduced-motion), so it works on every screen size;
   - non-intrusive: it re-asserts through late layout shifts (fonts, videos) but
     stops the instant you scroll, so it never fights you. A brand-new visit (no
     stored section) still opens at the hero. */

import { useEffect } from 'react'
import { ScrollTrigger, ScrollSmoother } from '../lib/animation'

const KEY = 'tdf:section'

export function useScrollRestoration() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // We own the scroll position across reloads, not the browser.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // Query by selector, NOT main.children: ScrollTrigger wraps each pinned
    // section (work / process) in a `.pin-spacer`, so the pinned sections aren't
    // direct children — querySelectorAll still finds them, in document order.
    const main = document.querySelector('main')
    const sections = main
      ? [...main.querySelectorAll<HTMLElement>('section[id], footer[id]')]
      : []
    if (!sections.length) return
    const firstId = sections[0].id

    // A pinned section can't be reached by its DOM position — ScrollTrigger parks
    // the pinned element at the END of its scroll span. Scroll to the pin's
    // `start` (its first frame) instead. Mirrors smoothScrollTo().
    const targetFor = (el: HTMLElement): number | HTMLElement => {
      const pin = ScrollTrigger.getAll().find(
        (st) =>
          !!st.pin &&
          (st.trigger === el || (st.trigger instanceof Element && st.trigger.contains(el))),
      )
      return pin ? (pin.start as number) : el
    }

    let engaged = false // the user has taken over scrolling — stop re-asserting
    const restore = () => {
      if (engaged) return
      const id = sessionStorage.getItem(KEY)
      if (!id || id === firstId) return // nothing saved, or it's the top section
      const el = document.getElementById(id)
      if (!el) return
      const t = targetFor(el)
      const smoother = ScrollSmoother.get()
      if (smoother) {
        smoother.scrollTo(t, false, typeof t === 'number' ? undefined : 'top top')
      } else if (typeof t === 'number') {
        window.scrollTo(0, t)
      } else {
        window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY)
      }
    }

    // Pin start/end are only final after a layout pass — refresh, then jump. Late
    // shifts (fonts, videos loading) fire more refreshes; re-assert on those too,
    // but only until the first user input so we never yank the page away.
    ScrollTrigger.refresh()
    restore()
    const onRefresh = () => restore()
    ScrollTrigger.addEventListener('refresh', onRefresh)

    const engage = () => {
      engaged = true
    }
    // Capture phase on document: ScrollSmoother consumes wheel/touch on its
    // wrapper, so listen ahead of it to catch the moment the user takes over.
    const engageOpts = { capture: true, once: true, passive: true } as const
    document.addEventListener('wheel', engage, engageOpts)
    document.addEventListener('touchstart', engage, engageOpts)
    document.addEventListener('pointerdown', engage, engageOpts)
    document.addEventListener('keydown', engage, { capture: true, once: true })

    // Remember the section that fills most of the viewport. ScrollSmoother
    // virtualizes scrolling (the window never sees a 'scroll' event), so observe
    // the sections directly with IntersectionObserver — it reports real on-screen
    // position however the page moved, decoupled from the scroll engine, on every
    // device. save() recomputes exact coverage; the thresholds just wake it.
    let raf = 0
    const save = () => {
      const vh = window.innerHeight
      let best = firstId
      let bestVisible = -1
      for (const el of sections) {
        const r = el.getBoundingClientRect()
        const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0))
        if (visible > bestVisible) {
          bestVisible = visible
          best = el.id
        }
      }
      sessionStorage.setItem(KEY, best)
    }
    const scheduleSave = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        save()
      })
    }
    const io = new IntersectionObserver(scheduleSave, { threshold: [0, 0.25, 0.5, 0.75, 1] })
    sections.forEach((el) => io.observe(el))
    // Second, independent signal: ScrollTrigger owns the virtualized scroll and
    // fires scrollEnd when it settles, on every engine — a belt-and-suspenders
    // catch so the final resting section is always recorded.
    ScrollTrigger.addEventListener('scrollEnd', scheduleSave)

    return () => {
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      ScrollTrigger.removeEventListener('scrollEnd', scheduleSave)
      io.disconnect()
      document.removeEventListener('wheel', engage, true)
      document.removeEventListener('touchstart', engage, true)
      document.removeEventListener('pointerdown', engage, true)
      document.removeEventListener('keydown', engage, true)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
}
