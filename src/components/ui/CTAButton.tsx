/* Primary / secondary CTA. Magnetic on fine pointers, matte color-only state
   changes (darken on hover, step-darker on press — no scale-bounce, per brand).
   Renders an <a> when `href` is given, otherwise a <button>. */

import type { ReactNode } from 'react'
import { useMagnetic } from '../../hooks/useMagnetic'

type Variant = 'primary' | 'ghost' | 'on-blue' | 'ghost-on-blue'

interface CTAButtonProps {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: Variant
  /** mono arrow suffix */
  arrow?: boolean
  className?: string
  ariaLabel?: string
  /** when this button triggers a menu/popover */
  ariaHasPopup?: boolean
  ariaExpanded?: boolean
  /** button type — 'submit' for use inside a form */
  type?: 'button' | 'submit'
  disabled?: boolean
}

const base =
  'df-cta inline-flex items-center justify-center gap-2 font-sans font-semibold ' +
  'select-none cursor-pointer transition-colors duration-200 ' +
  'min-h-[48px] px-6 text-[15px] tracking-tight ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2'

const variants: Record<Variant, string> = {
  // White serif/sans on blue darkens one step on hover
  primary:
    'bg-blue-700 text-snow hover:bg-blue-800 active:bg-blue-900 ' +
    'focus-visible:outline-blue-500 rounded-[2px]',
  // On a blue surface: snow fill, ink text
  'on-blue':
    'bg-snow text-blue-950 hover:bg-blue-100 active:bg-blue-200 ' +
    'focus-visible:outline-snow rounded-[2px]',
  // Hairline ghost
  ghost:
    'bg-transparent text-blue-950 border border-grey-300 ' +
    'hover:border-blue-950 active:bg-grey-100 focus-visible:outline-blue-500 rounded-[2px]',
  // Hairline ghost on a blue surface: snow text + faint snow border
  'ghost-on-blue':
    'bg-transparent text-snow border border-white/30 ' +
    'hover:border-snow hover:bg-white/10 active:bg-white/20 focus-visible:outline-snow rounded-[2px]',
}

export default function CTAButton({
  children,
  href,
  onClick,
  variant = 'primary',
  arrow = false,
  className = '',
  ariaLabel,
  ariaHasPopup,
  ariaExpanded,
  type = 'button',
  disabled = false,
}: CTAButtonProps) {
  const ref = useMagnetic<HTMLAnchorElement & HTMLButtonElement>(0.3)
  const cls = `${base} ${variants[variant]} ${className} disabled:cursor-not-allowed disabled:opacity-60`
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <span className="font-mono text-[1.1em] leading-none" aria-hidden>
          →
        </span>
      )}
    </>
  )

  if (href) {
    const external = href.startsWith('http')
    return (
      <a
        ref={ref}
        href={href}
        className={cls}
        aria-label={ariaLabel}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      aria-label={ariaLabel}
      aria-haspopup={ariaHasPopup ? 'menu' : undefined}
      aria-expanded={ariaHasPopup ? ariaExpanded : undefined}
    >
      {content}
    </button>
  )
}
