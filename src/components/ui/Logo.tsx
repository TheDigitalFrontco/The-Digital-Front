/* The DF lockup — uses the official uploaded logo (3-D white render) in every
   placeholder. The render is white, so on blue/dark grounds it sits directly;
   on light grounds it goes in a blue tile (the brand's own rule) so it stays
   visible. Sizes are responsive presets so the mark + wordmark scale and stay
   aligned across breakpoints. */

const LOGO = '/brand/logo-source-cropped.png'

type Tone = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

interface LogoProps {
  /** 'light' = on blue/dark ground (render directly); 'dark' = on light ground (blue tile). */
  tone?: Tone
  size?: Size
  /** Show the "The / Digital Front" wordmark beside the mark. */
  wordmark?: boolean
  className?: string
}

/* Responsive clamp() sizing per preset (mobile min → desktop max). */
const SIZES: Record<Size, { mark: string; the: string; word: string; gap: string }> = {
  sm: { mark: 'clamp(26px, 6vw, 30px)', the: '8px', word: '16px', gap: '10px' },
  md: { mark: 'clamp(30px, 5vw, 38px)', the: '9px', word: 'clamp(17px, 2.4vw, 20px)', gap: '12px' },
  lg: { mark: 'clamp(40px, 8vw, 56px)', the: '10px', word: 'clamp(20px, 3.2vw, 27px)', gap: '14px' },
}

export default function Logo({
  tone = 'light',
  size = 'md',
  wordmark = true,
  className = '',
}: LogoProps) {
  const s = SIZES[size]
  const onLight = tone === 'dark'
  const wordColor = onLight ? 'var(--blue-950)' : 'var(--white)'
  const theColor = onLight ? 'var(--grey-500)' : 'rgba(255,255,255,.62)'

  const mark = onLight ? (
    // White render needs a blue tile to read on light grounds.
    <span
      style={{
        display: 'grid',
        placeItems: 'center',
        background: 'var(--blue-700)',
        borderRadius: 4,
        width: `calc(${s.mark} + 0.55em)`,
        height: `calc(${s.mark} + 0.55em)`,
        flexShrink: 0,
      }}
    >
      <img src={LOGO} alt="The Digital Front" style={{ width: s.mark, height: s.mark, display: 'block' }} />
    </span>
  ) : (
    <img
      src={LOGO}
      alt="The Digital Front"
      style={{ width: s.mark, height: s.mark, display: 'block', flexShrink: 0 }}
    />
  )

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap }}>
      {mark}
      {wordmark && (
        <span style={{ display: 'grid', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: s.the,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: theColor,
            }}
          >
            The
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: s.word,
              color: wordColor,
              whiteSpace: 'nowrap',
              marginTop: 3,
            }}
          >
            Digital Front
          </span>
        </span>
      )}
    </span>
  )
}
