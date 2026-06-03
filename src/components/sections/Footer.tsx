/* FOOTER — deep navy close. Logo + closing line + the repeated "Start a Project"
   CTA, then Explore / Contact / Social link columns, and the Est. 2026 baseline.
   Static (no scroll animation) so it always renders fully — and the columns
   collapse to a single, comfortably-readable stack on small screens. Dark theme
   so the white logo sits directly. */

import type { ReactNode } from 'react'
import StartProjectButton from '../ui/StartProjectButton'
import Logo from '../ui/Logo'
import { EMAIL, mailtoHref, whatsappHref, WHATSAPP_DISPLAY, SOCIALS } from '../../lib/contact'

const EXPLORE = [
  { label: 'What we do', href: '#services' },
  { label: 'What we build', href: '#work' },
  { label: 'How we work', href: '#process' },
  { label: 'Kind words', href: '#testimonial' },
  { label: 'Start a project', href: '#start' },
]

/* ---- Brand / channel glyphs (monochrome, inherit currentColor) ----------- */

const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="m4 7.5 8 5 8-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
)

const WhatsAppIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
  </svg>
)

const TikTokIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

const InstagramIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
  </svg>
)

const FacebookIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.014 1.792-4.68 4.533-4.68 1.312 0 2.686.235 2.686.235v2.965h-1.513c-1.49 0-1.955.93-1.955 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
)

const SOCIAL_ICONS: Record<string, ReactNode> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
}

const linkClass =
  'inline-block text-[15px] text-blue-200 underline-offset-4 transition-colors hover:text-snow hover:underline'

/* Contact / social row: a leading glyph that brightens with the label on hover;
   only the label underlines. `min-w-0` + `break-words` keep long values (the
   email) from overflowing in a narrow column. */
function IconLink({
  href,
  icon,
  children,
  external = false,
}: {
  href: string
  icon: ReactNode
  children: ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group inline-flex max-w-full items-center gap-2.5 text-[15px] text-blue-200 transition-colors hover:text-snow"
    >
      <span aria-hidden className="flex-none text-blue-300 transition-colors group-hover:text-snow">
        {icon}
      </span>
      <span className="min-w-0 break-words underline-offset-4 group-hover:underline">{children}</span>
    </a>
  )
}

function ColHeading({ children }: { children: string }) {
  return (
    <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-blue-400">{children}</p>
  )
}

export default function Footer() {
  const year = 2026 // brand "Est." year (static — site says Est. 2026)

  return (
    <footer data-theme="dark" className="relative overflow-hidden bg-blue-950">
      <div className="df-texture-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10">
        {/* brand + repeated CTA */}
        <div className="flex flex-col gap-8 border-b border-white/12 pb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <Logo tone="light" size="lg" />
            <p className="df-lead mt-6 max-w-[34ch]" style={{ color: 'var(--blue-100)' }}>
              AI-generated videos and custom websites for founders who want to be seen.
            </p>
          </div>
          <StartProjectButton variant="on-blue" />
        </div>

        {/* link columns — single column on phones & small tablets (everything
            full-width and legible; the email never has to wrap), three across
            from md up, where each column is wide enough for the email on one
            line. */}
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-3">
          <nav aria-label="Explore">
            <ColHeading>Explore</ColHeading>
            <ul className="flex flex-col gap-2.5">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkClass}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <ColHeading>Contact</ColHeading>
            <ul className="flex flex-col gap-2.5">
              <li>
                <IconLink href={mailtoHref} icon={MailIcon}>
                  {EMAIL}
                </IconLink>
              </li>
              {whatsappHref && (
                <li>
                  <IconLink href={whatsappHref} icon={WhatsAppIcon} external>
                    {WHATSAPP_DISPLAY}
                  </IconLink>
                </li>
              )}
            </ul>
          </div>

          <nav aria-label="Social">
            <ColHeading>Social</ColHeading>
            <ul className="flex flex-col gap-2.5">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <IconLink href={s.href} icon={SOCIAL_ICONS[s.platform]} external>
                    {s.label}
                  </IconLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* baseline */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/12 pt-8 text-blue-300 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
            © {year} The Digital Front
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-blue-200">Est. {year}</p>
        </div>
      </div>
    </footer>
  )
}
