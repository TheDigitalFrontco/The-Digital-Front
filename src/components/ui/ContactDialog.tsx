/* CONTACT DIALOG — a branded modal form that emails submissions via Web3Forms
   (guaranteed delivery on a static host; no backend). Name · Email · Message →
   POST to api.web3forms.com → lands in create@thedigitalfront.co.
   Handles loading / success / error states, a spam honeypot, Escape + overlay
   close, focus-in on open, a basic focus trap, and reduced-motion. Portalled to
   <body> so it sits above the pinned sections. */

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import CTAButton from './CTAButton'
import { EASE, DURATION, prefersReducedMotion } from '../../lib/animation'
import { WEB3FORMS_ACCESS_KEY, EMAIL, mailtoHref, whatsappHref } from '../../lib/contact'

type Status = 'idle' | 'submitting' | 'success' | 'error'

interface Props {
  open: boolean
  onClose: () => void
}

/* The contact form is saved as you type so a refresh (or closing the dialog)
   never loses what you've written. It's cleared only when a message sends
   successfully — or, naturally, when you delete the fields yourself. Stored
   under one key, so any "Start a Project" button reopens the same draft. */
const DRAFT_KEY = 'df-contact-draft'
type Draft = { name: string; email: string; message: string }
const EMPTY_DRAFT: Draft = { name: '', email: '', message: '' }

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) }
  } catch {
    /* storage unavailable / malformed — fall back to an empty form */
  }
  return EMPTY_DRAFT
}

const inputCls =
  'w-full rounded-[2px] border border-grey-300 bg-snow px-3.5 py-2.5 text-[15px] text-blue-950 ' +
  'placeholder:text-grey-400 outline-none transition-colors focus:border-blue-500 ' +
  'focus:ring-2 focus:ring-blue-500/25'
const labelCls = 'mb-1.5 block font-mono text-[11px] uppercase tracking-[0.16em] text-grey-500'

export default function ContactDialog({ open, onClose }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState<Draft>(loadDraft)
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const reduce = prefersReducedMotion()
  const titleId = useId()

  // Persist the draft on every keystroke, so a refresh restores exactly what's
  // there. When the form is empty — whether never-typed, fully backspaced, or
  // cleared after a successful send — drop the key entirely. This effect is the
  // single writer, so emptying `form` anywhere reliably clears storage.
  useEffect(() => {
    try {
      if (form.name || form.email || form.message) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      } else {
        localStorage.removeItem(DRAFT_KEY)
      }
    } catch {
      /* ignore quota / private-mode failures */
    }
  }, [form])

  const updateField =
    (field: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  // On open: clear any prior status and re-sync the draft from storage (in case
  // another "Start a Project" button edited it). Never wipes the fields.
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setErrorMsg('')
      setForm(loadDraft())
      const t = setTimeout(() => firstFieldRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  // Escape to close + a basic Tab focus-trap within the dialog.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])',
        )
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      const fd = new FormData(e.currentTarget)
      fd.append('access_key', WEB3FORMS_ACCESS_KEY)
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        // Sent — empty the draft; the persist effect then clears storage.
        setForm(EMPTY_DRAFT)
      } else {
        setStatus('error')
        setErrorMsg(data.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error — please try again, or reach us on WhatsApp.')
    }
  }

  const submitting = status === 'submitting'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          {/* overlay */}
          <motion.div
            className="absolute inset-0 bg-blue-950/70 backdrop-blur-[2px]"
            aria-hidden
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: reduce ? 0.001 : 0.25, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: reduce ? 0.001 : 0.2, ease: EASE } }}
          />

          {/* dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: reduce ? 0 : 18, scale: reduce ? 1 : 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: reduce ? 0.001 : DURATION.base, ease: EASE },
              }}
              exit={{
                opacity: 0,
                y: reduce ? 0 : 12,
                scale: reduce ? 1 : 0.98,
                transition: { duration: reduce ? 0.001 : 0.2, ease: EASE },
              }}
              className="relative w-full max-w-md rounded-[6px] bg-snow p-6 shadow-[var(--shadow-3)] sm:p-8"
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center rounded-full text-grey-500 transition-colors hover:bg-grey-100 hover:text-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>

              {status === 'success' ? (
                <div className="py-6 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-700">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <h2 id={titleId} className="df-h3 mt-5">
                    Message sent.
                  </h2>
                  <p className="df-body mt-2">
                    Thanks, we&rsquo;ve got it! We&rsquo;ll reply as soon as possible.
                  </p>
                  <div className="mt-7">
                    <CTAButton variant="primary" onClick={onClose}>
                      Done
                    </CTAButton>
                  </div>
                </div>
              ) : (
                <>
                  <p className="df-kicker" style={{ color: 'var(--blue-500)' }}>
                    Start a project
                  </p>
                  <h2 id={titleId} className="df-h3 mt-2">
                    Tell us what you&rsquo;re building.
                  </h2>
                  <p className="df-small mt-2">A few lines is plenty, we&rsquo;ll take it from there.</p>

                  <form onSubmit={onSubmit} className="mt-6">
                    {/* honeypot — hidden from humans, catches bots */}
                    <input
                      type="checkbox"
                      name="botcheck"
                      className="hidden"
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                    />
                    <input type="hidden" name="subject" value="New project enquiry — The Digital Front" />
                    <input type="hidden" name="from_name" value="The Digital Front website" />

                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`${titleId}-name`} className={labelCls}>
                          Name
                        </label>
                        <input
                          ref={firstFieldRef}
                          id={`${titleId}-name`}
                          name="name"
                          required
                          autoComplete="name"
                          placeholder="Your name"
                          className={inputCls}
                          value={form.name}
                          onChange={updateField('name')}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${titleId}-email`} className={labelCls}>
                          Email
                        </label>
                        <input
                          id={`${titleId}-email`}
                          name="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@company.com"
                          className={inputCls}
                          value={form.email}
                          onChange={updateField('email')}
                        />
                      </div>
                      <div>
                        <label htmlFor={`${titleId}-message`} className={labelCls}>
                          Message
                        </label>
                        <textarea
                          id={`${titleId}-message`}
                          name="message"
                          required
                          rows={4}
                          placeholder="What are you launching?"
                          className={`${inputCls} resize-none`}
                          value={form.message}
                          onChange={updateField('message')}
                        />
                      </div>
                    </div>

                    {status === 'error' && (
                      <p role="alert" className="mt-3 text-[13px] text-critical">
                        {errorMsg}
                      </p>
                    )}

                    <div className="mt-6 flex items-center gap-4">
                      <CTAButton type="submit" variant="primary" arrow={!submitting} disabled={submitting}>
                        {submitting ? 'Sending…' : 'Send message'}
                      </CTAButton>
                      {whatsappHref && (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[12px] uppercase tracking-[0.16em] text-grey-500 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
                        >
                          or WhatsApp →
                        </a>
                      )}
                    </div>

                    <p className="mt-5 text-[12px] text-grey-400">
                      Prefer email?{' '}
                      <a href={mailtoHref} className="underline-offset-2 hover:text-blue-700 hover:underline">
                        {EMAIL}
                      </a>
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
