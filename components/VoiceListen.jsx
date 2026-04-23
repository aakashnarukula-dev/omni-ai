// Omni — Voice capture (single direction: big waveform fullscreen)

const VoiceListen = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body" style={{ padding: 0 }}>
      <div style={{ padding:'12px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span className="tag"><span className="dot" style={{background:'var(--ok)'}}/> live</span>
        <span className="eyebrow">tap to stop</span>
      </div>

      <div style={{
        position:'absolute', left: 0, right: 0, top: '24%',
        display:'flex', flexDirection:'column', alignItems:'center', gap: 32
      }}>
        <div className="eyebrow">Listening</div>
        <div style={{ width: '100%', padding: '0 28px' }}>
          <Waveform bars={34} height={150} seed={2.1}/>
        </div>
        <div style={{ padding:'0 40px', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--serif)', fontSize: 26, lineHeight: 1.15, letterSpacing:'-0.01em' }}>
            "Remind me to call mom at six, and add buy milk to my groceries…"
          </div>
        </div>
      </div>

      <div style={{
        position:'absolute', bottom: 110, left: 0, right: 0,
        display:'flex', justifyContent:'center', gap: 12
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36,
          background:'var(--ink)', color:'var(--bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 0 8px rgba(250,250,250,0.08), 0 0 0 16px rgba(250,250,250,0.04)'
        }}>
          <div style={{ width: 16, height: 16, background:'var(--bg)', borderRadius: 3 }}/>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { VoiceListen });
