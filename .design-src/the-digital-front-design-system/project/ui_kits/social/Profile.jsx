/* The Digital Front — Social Kit: Instagram-style profile header. */

function ProfileBar({ onTab, tab }) {
  const Stat = ({ n, l }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 19, color: 'var(--blue-950)' }}>{n}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--grey-500)' }}>{l}</div>
    </div>
  );
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <img src="../../assets/avatar-blue.png" style={{ width: 116, height: 116, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 22, color: 'var(--blue-950)' }}>thedigitalfront</div>
            <button style={btn('solid')}>Follow</button>
            <button style={btn('ghost')}>Message</button>
          </div>
          <div style={{ display: 'flex', gap: 36, marginTop: 18 }}>
            <Stat n="48" l="posts" /><Stat n="9,204" l="followers" /><Stat n="112" l="following" />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--blue-950)' }}>The Digital Front</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--blue-500)', marginTop: 4 }}>AI Video · Front-end Craft</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, lineHeight: 1.5, color: 'var(--grey-700)', marginTop: 8, maxWidth: 440 }}>
          We turn ideas into reality. Motion that sells, sites that feel inevitable.<br />↳ Start a project
        </div>
      </div>
      <div style={{ display: 'flex', gap: 0, marginTop: 26, borderTop: '1px solid var(--grey-200)' }}>
        {['Feed', 'Stories'].map(t => (
          <button key={t} onClick={() => onTab(t)} style={{
            flex: '0 0 auto', padding: '16px 26px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: tab === t ? 'var(--blue-950)' : 'var(--grey-400)',
            borderTop: tab === t ? '2px solid var(--blue-700)' : '2px solid transparent', marginTop: -1 }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function btn(kind) {
  const base = { fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, padding: '8px 18px',
    borderRadius: 4, cursor: 'pointer', border: '1px solid transparent' };
  if (kind === 'solid') return { ...base, background: 'var(--blue-700)', color: '#fff' };
  return { ...base, background: 'transparent', color: 'var(--blue-950)', borderColor: 'var(--grey-300)' };
}

Object.assign(window, { ProfileBar });
