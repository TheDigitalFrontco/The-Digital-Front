/* StartProjectButton — the page-wide "Start a Project" CTA. One button that opens
   a small popover to choose WhatsApp (instant chat) or Send a message (a branded
   contact form that emails via Web3Forms). Consistent everywhere — hero, Work,
   conversion section, footer.

   The menu portals to <body> (never clipped by a pinned section's overflow),
   flips above the button near the viewport bottom, and closes on outside-click,
   Escape (refocuses trigger), scroll, resize. Reduced-motion safe. If WhatsApp
   isn't configured, the button opens the form directly (no popover). */

import { useEffect, useRef, useState, useId } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import CTAButton from './CTAButton'
import ContactDialog from './ContactDialog'
import { EASE, DURATION, prefersReducedMotion } from '../../lib/animation'
import { whatsappHref } from '../../lib/contact'

type Variant = 'on-blue' | 'primary' | 'ghost' | 'ghost-on-blue'

const ChatIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

const MailIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="m4 7 8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

interface Item {
  label: string
  sub: string
  icon: ReactNode
  href?: string
  external?: boolean
  action?: 'form'
}

const MENU_W = 248
const MENU_H = 128
const GAP = 10

interface Props {
  variant?: Variant
  label?: string
  className?: string
}

export default function StartProjectButton({
  variant = 'on-blue',
  label = 'Start a Project',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null)
  const wrapRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const reduce = prefersReducedMotion()
  const menuId = useId()

  const items: Item[] = [
    ...(whatsappHref
      ? [{ label: 'WhatsApp', sub: 'Fastest reply', icon: ChatIcon, href: whatsappHref, external: true }]
      : []),
    { label: 'Send a message', sub: 'We’ll get back to you', icon: MailIcon, action: 'form' as const },
  ]
  const single = items.length === 1

  const triggerEl = () => wrapRef.current?.querySelector('a,button') as HTMLElement | null

  const place = () => {
    const el = triggerEl()
    if (!el) return
    const r = el.getBoundingClientRect()
    const up = r.bottom + GAP + MENU_H > window.innerHeight && r.top - GAP - MENU_H > 0
    const top = up ? r.top - GAP - MENU_H : r.bottom + GAP
    const left = Math.max(12, Math.min(r.left + r.width / 2 - MENU_W / 2, window.innerWidth - MENU_W - 12))
    setPos({ top, left, up })
  }

  const onTrigger = () => {
    if (single) {
      setFormOpen(true)
      return
    }
    if (!open) place()
    setOpen((o) => !o)
  }

  const openForm = () => {
    setOpen(false)
    setFormOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || wrapRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerEl()?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  useEffect(() => {
    if (open && pos) (menuRef.current?.querySelector('a,button') as HTMLElement | null)?.focus()
  }, [open, pos])

  return (
    <span ref={wrapRef} className={`inline-block ${className}`}>
      <CTAButton
        variant={variant}
        arrow
        onClick={onTrigger}
        ariaLabel={label}
        ariaHasPopup={!single}
        ariaExpanded={open}
      >
        {label}
      </CTAButton>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Start a project — choose a channel"
              initial={{ opacity: 0, y: reduce ? 0 : pos.up ? 6 : -6, scale: reduce ? 1 : 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: reduce ? 0.001 : DURATION.fast, ease: EASE },
              }}
              exit={{
                opacity: 0,
                y: reduce ? 0 : pos.up ? 6 : -6,
                scale: reduce ? 1 : 0.98,
                transition: { duration: reduce ? 0.001 : 0.14, ease: EASE },
              }}
              style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_W }}
              className="z-[60] overflow-hidden rounded-[4px] border border-grey-200 bg-snow p-1.5 shadow-[var(--shadow-3)]"
            >
              {items.map((c) => {
                const inner = (
                  <>
                    <span
                      aria-hidden
                      className="grid h-9 w-9 flex-none place-items-center rounded-full bg-blue-50 text-blue-700"
                    >
                      {c.icon}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-[15px] font-semibold text-blue-950">{c.label}</span>
                      <span className="block truncate font-mono text-[11px] text-grey-500">{c.sub}</span>
                    </span>
                    <span
                      aria-hidden
                      className="ml-auto font-mono text-blue-700 transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </>
                )
                const cls =
                  'group flex w-full items-center gap-3 rounded-[2px] px-3 py-2.5 transition-colors hover:bg-grey-50 focus-visible:bg-grey-50 focus-visible:outline-none'
                return c.href ? (
                  <a
                    key={c.label}
                    role="menuitem"
                    href={c.href}
                    {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onClick={() => setOpen(false)}
                    className={cls}
                  >
                    {inner}
                  </a>
                ) : (
                  <button key={c.label} type="button" role="menuitem" onClick={openForm} className={cls}>
                    {inner}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <ContactDialog open={formOpen} onClose={() => setFormOpen(false)} />
    </span>
  )
}
