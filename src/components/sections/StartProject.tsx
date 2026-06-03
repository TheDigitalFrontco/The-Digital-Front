/* START A PROJECT — the bold blue conversion block, the closing push before the
   footer. Big centered statement on brand blue with the animated grid; magnetic
   CTAs to WhatsApp + email. Scroll reveal (Framer; GSAP only drives the grid). */

import { Reveal, RevealItem } from '../ui/Reveal'
import StartProjectButton from '../ui/StartProjectButton'
import GridBackground from '../ui/GridBackground'

export default function StartProject() {
  return (
    <section
      id="start"
      data-theme="brand"
      className="relative isolate overflow-hidden"
      style={{ background: 'var(--blue-700)' }}
    >
      <GridBackground opacity={0.07} cell={64} />

      <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-5 py-28 text-center sm:px-8 sm:py-36">
        <Reveal>
          <RevealItem>
            <p className="df-kicker" style={{ color: 'rgba(255,255,255,.7)' }}>
              05 — Start a project
            </p>
          </RevealItem>

          <RevealItem>
            <h2
              className="mt-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 'clamp(2.75rem, 9vw, 5.5rem)',
                lineHeight: 0.98,
                letterSpacing: '-0.022em',
                color: 'var(--white)',
                textWrap: 'balance',
              }}
            >
              Let&rsquo;s build your <span className="df-em">front.</span>
            </h2>
          </RevealItem>

          <RevealItem>
            <p
              className="df-lead mx-auto mt-6 max-w-[46ch]"
              style={{ color: 'var(--blue-100)' }}
            >
              Tell us what you&rsquo;re launching. We&rsquo;ll turn it into video that stops the scroll
              and a site that closes the deal.
            </p>
          </RevealItem>

          <RevealItem>
            <div className="mt-10 flex justify-center">
              <StartProjectButton variant="on-blue" />
            </div>
          </RevealItem>
        </Reveal>
      </div>
    </section>
  )
}
