// Omni — Home (editorial) + Home-with-voice-overlay

// ─────────── HomeA — Editorial ────────────
const HomeA = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll" style={{ paddingTop: 4 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24, marginTop: 4 }}>
        <span className="eyebrow">Tuesday · 22 Apr</span>
        <div className="icon-btn" style={{ width: 32, height: 32, borderRadius: 8 }}>
          <IconSearch size={15} />
        </div>
      </div>

      <h1 className="serif-display" style={{ fontSize: 42, margin: 0, lineHeight: 1.02 }}>
        Good morning,<br />
        <span style={{ color: 'var(--ink-dim)' }}>Akash.</span>
      </h1>
      <p style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
        You have <span style={{ color:'var(--ink)' }}>4 tasks</span> &nbsp;·&nbsp; <span style={{color:'var(--urgent)'}}>1 urgent</span> &nbsp;·&nbsp; <span style={{ color:'var(--ink)' }}>2 alarms</span> today.
      </p>

      {/* Voice pulse card removed — listening overlay lives elsewhere */}

      <div className="section-head">
        <h3>Today</h3>
        <span className="eyebrow">04 items</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
        <div className="row-card">
          <div className="check done">
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="var(--bg)" strokeWidth="3" fill="none"><path d="M5 12 L10 17 L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="strike" style={{ fontSize: 14 }}>Pay electricity bill</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>#bills · done 08:14</div>
          </div>
        </div>
        <div className="row-card">
          <div className="check" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14 }}>Review Q2 design proposal</div>
            <div className="eyebrow" style={{ marginTop: 2, color: 'var(--urgent)' }}>#work · P1 · due 11:30</div>
          </div>
          <IconArrow size={14} />
        </div>
        <div className="row-card">
          <div className="check" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14 }}>Call mom before dinner</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>#personal · P2</div>
          </div>
          <IconArrow size={14} />
        </div>
        <div className="row-card">
          <div style={{ width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', color: 'var(--urgent)' }}>
            <IconBell size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14 }}>Dentist appointment</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>16:00 · alarm set</div>
          </div>
          <span className="tag">16:00</span>
        </div>
      </div>

      {/* Mini card strip */}
      <div className="section-head">
        <h3>Stack</h3>
        <span className="eyebrow">05 items</span>
      </div>
      <div style={{ position:'relative', height: 120 }}>
        {['visa','mc','pan','other'].map((k, i) => (
          <div key={k} className={`cc ${k}`} style={{
            position:'absolute', left: 0, right: 0,
            top: i * 14, width: `${100 - i*3}%`, margin: '0 auto',
            height: 120 - i*14, padding: '14px 16px',
            opacity: i === 0 ? 1 : 0.8 - i * 0.1,
          }}>
            {i === 0 && <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div className="chip" />
                <span style={{ fontFamily:'var(--mono)', fontSize: 10, letterSpacing:'0.1em', color:'var(--ink-dim)'}}>VISA · DEBIT</span>
              </div>
              <div>
                <div className="num">•••• 8842</div>
                <div style={{ fontSize: 10, color:'var(--ink-faint)', marginTop: 4, fontFamily:'var(--mono)'}}>AKASH V · 09/28</div>
              </div>
            </>}
          </div>
        ))}
      </div>
    </div>
    <TabBar active="home" />
  </div>
);

// ─────────── HomeVoiceOverlay — Home with the voice capture overlay on top ────────────
// Home is visible but dimmed behind a centered orb-with-rings dictation sheet.
const HomeVoiceOverlay = () => (
  <div className="omni-screen" style={{ position:'relative' }}>
    {/* dimmed home behind */}
    <div style={{ position:'absolute', inset: 0, filter:'brightness(0.4) blur(1px)' }}>
      <HomeA />
    </div>

    {/* scrim */}
    <div style={{
      position:'absolute', inset: 0,
      background:'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.2), rgba(0,0,0,0.78) 70%)',
    }}/>

    {/* overlay sheet */}
    <div style={{
      position:'absolute', left: 16, right: 16, bottom: 104,
      padding: '24px 22px 22px',
      borderRadius: 24,
      background:'rgba(20,20,22,0.92)',
      border:'1px solid rgba(255,255,255,0.08)',
      backdropFilter:'blur(18px)',
      boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
      display:'flex', flexDirection:'column', alignItems:'center', gap: 18
    }}>
      {/* grab handle */}
      <div style={{ width: 36, height: 3, borderRadius: 2, background:'rgba(255,255,255,0.18)', marginTop: -6 }}/>

      {/* orb w/ rings */}
      <div style={{ position:'relative', width: 180, height: 180, marginTop: 4 }}>
        {[180, 148, 118].map((s, i) => (
          <div key={s} style={{
            position:'absolute', inset: `${(180-s)/2}px`,
            borderRadius: '50%', border: `1px solid rgba(255,255,255,${0.06 + (2-i)*0.05})`,
          }}/>
        ))}
        <div style={{
          position:'absolute', inset: 46,
          borderRadius:'50%',
          background:'radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ width: 80 }}>
            <Waveform bars={12} height={50} seed={1.8}/>
          </div>
        </div>
      </div>

      <div style={{ textAlign:'center' }}>
        <div className="eyebrow">dictating · 00:08</div>
        <div style={{ marginTop: 10, fontSize: 15, color:'var(--ink-dim)', lineHeight: 1.4, maxWidth: 280 }}>
          "Add milk and eggs to my grocery list and set an alarm for dentist at four tomorrow"
        </div>
      </div>

      <div style={{ display:'flex', gap: 14, marginTop: 2 }}>
        <div className="icon-btn" style={{ width: 48, height: 48, borderRadius: 24 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6 L18 18 M6 18 L18 6" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{
          width: 60, height: 60, borderRadius: 30,
          background:'var(--ink)', color:'var(--bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ width: 14, height: 14, background:'var(--bg)', borderRadius: 3 }}/>
        </div>
        <div className="icon-btn" style={{ width: 48, height: 48, borderRadius: 24 }}>
          <IconSparkle size={16}/>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { HomeA, HomeVoiceOverlay });
