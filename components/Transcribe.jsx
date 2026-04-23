// Omni — Transcribing & AI sorting (single best direction: split cards)
const Transcribe = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll">
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 4 }}>
        <IconArrow dir="left" size={16}/>
        <span className="eyebrow">transcribed · 00:12</span>
      </div>

      <h1 className="serif-display" style={{ fontSize: 28, marginTop: 14 }}>
        I heard <span style={{ color:'var(--ink-dim)'}}>3 things.</span>
      </h1>
      <p style={{ fontSize: 12, color:'var(--ink-faint)', marginTop: 6 }}>
        Review the split and confirm before saving.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap: 12, marginTop: 22 }}>
        {/* Task */}
        <div style={{
          padding: 16, borderRadius: 'var(--r-md)',
          background:'var(--bg-raise)', border: '1px solid var(--line)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap: 6 }}>
              <span className="tag solid">TASK</span>
              <span className="tag urgent">P1</span>
              <span className="tag">#work</span>
            </div>
            <IconSparkle size={14}/>
          </div>
          <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.35 }}>
            Review Q2 design proposal before 11:30 today.
          </div>
          <div className="eyebrow" style={{ marginTop: 10, color:'var(--ink-dim)'}}>
            ⏱ due today 11:30 · detected from "need to review before the 11:30 stand-up"
          </div>
        </div>

        {/* Alarm */}
        <div style={{
          padding: 16, borderRadius: 'var(--r-md)',
          background:'var(--bg-raise)', border: '1px solid var(--line)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap: 6 }}>
              <span className="tag solid">ALARM</span>
              <span className="tag">#personal</span>
            </div>
            <IconBell size={14}/>
          </div>
          <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.35 }}>
            Call mom at 6:00 PM.
          </div>
          <div className="eyebrow" style={{ marginTop: 10 }}>⏱ today · 18:00 · alarm attached</div>
        </div>

        {/* Note / auxiliary */}
        <div style={{
          padding: 16, borderRadius: 'var(--r-md)',
          background:'var(--bg-raise)', border: '1px solid var(--line)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap: 6 }}>
              <span className="tag solid">ITEM</span>
              <span className="tag">#shopping</span>
            </div>
            <IconDoc size={14}/>
          </div>
          <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.4, color:'var(--ink-dim)'}}>
            Add <span style={{ color:'var(--ink)'}}>milk</span> and <span style={{ color:'var(--ink)'}}>eggs</span> to groceries list.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap: 8, marginTop: 20 }}>
        <button style={{
          flex: 1, padding: '14px', borderRadius: 99,
          background:'transparent', color:'var(--ink)',
          border:'1px solid var(--line-strong)',
          fontSize: 13, fontFamily:'var(--sans)'
        }}>Edit</button>
        <button style={{
          flex: 2, padding: '14px', borderRadius: 99,
          background:'var(--ink)', color:'var(--bg)', border:'none',
          fontSize: 13, fontFamily:'var(--sans)', fontWeight: 500
        }}>Save all · 3 items</button>
      </div>
    </div>
  </div>
);

Object.assign(window, { Transcribe });
