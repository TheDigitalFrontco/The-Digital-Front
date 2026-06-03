/* The Digital Front — Social Kit: post & story templates.
   Each template renders on a fixed 1080-unit canvas, scaled to fit its container.
   Exports to window for use by index.html. */

const MARK = '../../assets/logo-source-cropped.png';
const MARK_W = MARK;  // uploaded logo (white render) — for dark/blue grounds

/* On light grounds the white logo needs a blue tile to stay visible. */
const MarkTile = ({ size = 84, logo = 54 }) => (
  <div style={{ width: size, height: size, background: 'var(--blue-700)', borderRadius: 6, display: 'grid', placeItems: 'center' }}>
    <img src={MARK} style={{ width: logo }} />
  </div>
);

/* Scales a fixed canvas (w×h in 1080-space) down to a display width. */
function Frame({ w, h, display, children, style }) {
  const scale = display / w;
  return (
    <div style={{ width: display, height: h * scale, overflow: 'hidden', ...style }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'relative' }}>
        {children}
      </div>
    </div>
  );
}

const gridBg = (alpha = 0.07, size = 64) =>
  `linear-gradient(rgba(255,255,255,${alpha}) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,${alpha}) 1px,transparent 1px)`;
const dotBg = (alpha = 0.5, c = '62,88,127') => `radial-gradient(rgba(${c},${alpha}) 2px,transparent 2px)`;

const Kicker = ({ children, color }) => (
  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: 26, letterSpacing: '0.34em',
    textTransform: 'uppercase', color }}>{children}</div>
);

/* ---------------------------------------------------------------- SQUARE POSTS (1080×1080) */

/* 1 · Statement — the signature: white serif on slate blue + grid texture */
function PostStatement({ display = 320 }) {
  return (
    <Frame w={1080} h={1080} display={display}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--blue-700)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: gridBg(0.06), backgroundSize: '64px 64px' }} />
      <div style={{ position: 'absolute', inset: 0, padding: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <img src={MARK_W} style={{ width: 64 }} />
          <Kicker color="rgba(255,255,255,.7)">The Digital Front</Kicker>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 150, lineHeight: 0.96,
            letterSpacing: '-0.02em', color: '#fff' }}>
            Ideas into <span style={{ fontStyle: 'italic', fontWeight: 400 }}>reality.</span>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 34, lineHeight: 1.5,
            color: 'var(--blue-100)', marginTop: 34, maxWidth: 720 }}>
            AI-generated video and front-end craft for founders who want to be seen.
          </div>
        </div>
        <Kicker color="rgba(255,255,255,.5)">01 — Studio</Kicker>
      </div>
    </Frame>
  );
}

/* 2 · Services — two stacked service lines, light ground */
function PostServices({ display = 320 }) {
  const Row = ({ idx, k, title, last }) => (
    <div style={{ padding: '54px 0', borderTop: '2px solid var(--blue-200)',
      ...(last ? { borderBottom: '2px solid var(--blue-200)' } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Kicker color="var(--blue-500)">{k}</Kicker>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--grey-400)' }}>{idx}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 96, lineHeight: 1.0,
        letterSpacing: '-0.02em', color: 'var(--blue-950)', marginTop: 18 }}>{title}</div>
    </div>
  );
  return (
    <Frame w={1080} h={1080} display={display}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--white)' }} />
      <div style={{ position: 'absolute', inset: 0, padding: 90, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 56 }}>
          <MarkTile size={84} logo={52} />
          <Kicker color="var(--grey-400)">What we do</Kicker>
        </div>
        <Row idx="01" k="Motion" title={<>Video that <span style={{ fontStyle: 'italic', fontWeight: 400 }}>moves.</span></>} />
        <Row idx="02" k="Front-end" title="Sites, finished." last />
      </div>
    </Frame>
  );
}

/* 3 · Quote / testimonial — blue serif on snow */
function PostQuote({ display = 320 }) {
  return (
    <Frame w={1080} h={1080} display={display}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--grey-50)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: dotBg(0.4), backgroundSize: '44px 44px', opacity: 0.5 }} />
      <div style={{ position: 'absolute', inset: 0, padding: 90, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <MarkTile size={88} logo={56} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 78, lineHeight: 1.12,
          letterSpacing: '-0.015em', color: 'var(--blue-800)' }}>
          “They made our launch feel <span style={{ fontStyle: 'italic', fontWeight: 400 }}>inevitable.</span>”
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 2, background: 'var(--blue-700)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 30, color: 'var(--blue-950)' }}>Maya R.</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, letterSpacing: '0.1em', color: 'var(--grey-500)' }}>FOUNDER · NORTHBOUND</div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* 4 · Identity — big mark, the avatar/announcement */
function PostMark({ display = 320 }) {
  return (
    <Frame w={1080} h={1080} display={display}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--blue-950)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: gridBg(0.05), backgroundSize: '90px 90px' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <img src={MARK_W} style={{ width: 360 }} />
      </div>
      <div style={{ position: 'absolute', left: 90, right: 90, bottom: 90, display: 'flex', justifyContent: 'space-between' }}>
        <Kicker color="rgba(255,255,255,.6)">The Digital Front</Kicker>
        <Kicker color="rgba(255,255,255,.35)">EST. 2026</Kicker>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- STORY (1080×1920) */
function StoryStatement({ display = 240 }) {
  return (
    <Frame w={1080} h={1920} display={display} style={{ borderRadius: 6 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'var(--blue-700)' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: gridBg(0.06), backgroundSize: '72px 72px' }} />
      <div style={{ position: 'absolute', inset: 0, padding: 96, display: 'flex', flexDirection: 'column' }}>
        <img src={MARK_W} style={{ width: 72 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 132, lineHeight: 0.98,
            letterSpacing: '-0.02em', color: '#fff' }}>
            The front of <span style={{ fontStyle: 'italic', fontWeight: 400 }}>everything</span> you build.
          </div>
        </div>
        <div style={{ borderTop: '2px solid rgba(255,255,255,.25)', paddingTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 38, color: '#fff' }}>Start a project</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 56, color: '#fff' }}>→</div>
        </div>
      </div>
    </Frame>
  );
}

Object.assign(window, { Frame, PostStatement, PostServices, PostQuote, PostMark, StoryStatement });
