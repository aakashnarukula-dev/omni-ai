// Omni — Camera capture with card guide (3 directions)

// ─────────── CameraA — Full-screen with card guide ────────────
const CameraA = () => (
  <div className="omni-screen" style={{ background:'#000' }}>
    <StatusBar />
    <div className="omni-body" style={{ padding: 0 }}>
      {/* Fake camera feed */}
      <div style={{
        position:'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, #1a1a1a 0%, #000 80%)',
      }}>
        {/* subtle "desk" feel */}
        <div style={{ position:'absolute', inset:'40% 10% 10% 8%',
          background:'linear-gradient(135deg, #1a1410 0%, #0a0806 100%)',
          borderRadius: 12, opacity: 0.7
        }}/>
      </div>

      {/* dim everything outside the card guide */}
      <div style={{
        position:'absolute', inset: 0,
        background:'rgba(0,0,0,0.6)',
        WebkitMaskImage: 'radial-gradient(rectangle, transparent 0, black 100%)',
      }}/>
      {/* Card-aspect rectangle (85.6 × 54 mm ≈ 1.586:1) */}
      <div style={{
        position:'absolute', top: '38%', left: 24, right: 24,
        aspectRatio: '1.586', borderRadius: 16,
        boxShadow:'0 0 0 9999px rgba(0,0,0,0.72)',
        border:'1.5px solid var(--ink)',
      }}>
        {/* Corner marks */}
        {[
          {t:0,l:0,rt:'0 0 0 2px'},{t:0,r:0,rt:'0 0 2px 0'},
          {b:0,l:0,rt:'2px 0 0 0'},{b:0,r:0,rt:'0 2px 0 0'},
        ].map((p,i)=>(
          <div key={i} style={{
            position:'absolute', width: 22, height: 22,
            top: p.t, bottom: p.b, left: p.l, right: p.r,
            borderTop: p.t===0 ? '2px solid var(--ink)' : 'none',
            borderBottom: p.b===0 ? '2px solid var(--ink)' : 'none',
            borderLeft: p.l===0 ? '2px solid var(--ink)' : 'none',
            borderRight: p.r===0 ? '2px solid var(--ink)' : 'none',
            borderRadius: p.rt
          }}/>
        ))}
        {/* AI scanning line */}
        <div style={{
          position:'absolute', left: 16, right: 16, top: '50%',
          height: 1, background:'linear-gradient(90deg, transparent, var(--ink), transparent)',
        }}/>
        <div style={{ position:'absolute', left: 12, top: 10 }}>
          <span className="tag" style={{ background:'rgba(0,0,0,0.5)'}}><span className="dot" style={{background:'var(--ok)'}}/> detecting</span>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ position:'absolute', top: 58, left: 0, right: 0, display:'flex', justifyContent:'space-between', padding:'0 20px'}}>
        <div className="icon-btn" style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6 L18 18 M6 18 L18 6" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ textAlign:'center', flex:1 }}>
          <div className="eyebrow">Scan card</div>
          <div style={{ fontFamily:'var(--serif)', fontSize: 18, marginTop: 2 }}>Credit / Debit</div>
        </div>
        <div className="icon-btn" style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.15)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 10 L9 13 L6 16 M18 10 L15 13 L18 16" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Bottom instructions + shutter */}
      <div style={{ position:'absolute', bottom: 40, left: 0, right: 0, textAlign:'center'}}>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Align card inside the frame</div>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap: 28 }}>
          <div className="icon-btn" style={{ width: 48, height: 48, borderRadius: 24, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.15)'}}>
            <IconDoc size={18}/>
          </div>
          <div style={{
            width: 68, height: 68, borderRadius: 34,
            border:'3px solid var(--ink)', padding: 5
          }}>
            <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'var(--ink)'}}/>
          </div>
          <div className="icon-btn" style={{ width: 48, height: 48, borderRadius: 24, background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.15)'}}>
            <span style={{ fontSize: 10, fontFamily:'var(--mono)'}}>MANUAL</span>
          </div>
        </div>
      </div>

      {/* Segmented card type */}
      <div style={{
        position:'absolute', bottom: 140, left: 20, right: 20,
        display:'flex', background:'rgba(0,0,0,0.6)', borderRadius: 99,
        border:'1px solid rgba(255,255,255,0.1)', padding: 4
      }}>
        {['CREDIT', 'DEBIT', 'PAN', 'OTHER'].map((t,i)=>(
          <div key={t} style={{
            flex: 1, padding: '8px', textAlign:'center',
            borderRadius: 99, background: i===0 ? 'var(--ink)' : 'transparent',
            color: i===0 ? 'var(--bg)' : 'var(--ink-dim)',
            fontFamily:'var(--mono)', fontSize: 10, letterSpacing:'0.08em'
          }}>{t}</div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────── CameraB — PAN card (vertical-ish) ────────────
const CameraB = () => (
  <div className="omni-screen" style={{ background:'#000' }}>
    <StatusBar />
    <div className="omni-body" style={{ padding: 0 }}>
      <div style={{
        position:'absolute', inset: 0,
        background:'radial-gradient(ellipse at 50% 40%, #1a1a20 0%, #000 80%)',
      }}/>

      {/* PAN card aspect */}
      <div style={{
        position:'absolute', top: '32%', left: 20, right: 20,
        aspectRatio: '1.586', borderRadius: 12,
        boxShadow:'0 0 0 9999px rgba(0,0,0,0.78)',
        border:'1.5px dashed var(--ink)',
        background:'linear-gradient(135deg, rgba(18,32,40,0.3) 0%, transparent 100%)'
      }}>
        <div style={{ position:'absolute', top: 10, left: 12, display:'flex', gap: 4 }}>
          <span className="tag" style={{ background:'rgba(0,0,0,0.5)', fontSize: 9 }}>INCOME TAX DEPT.</span>
        </div>
        <div style={{ position:'absolute', bottom: 10, left: 12, right: 12, display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontFamily:'var(--mono)', fontSize: 10, color:'var(--ink-dim)'}}>PAN · 10 chars</span>
          <span style={{ fontFamily:'var(--mono)', fontSize: 10, color:'var(--ok)'}}>● OCR ready</span>
        </div>
      </div>

      {/* Top */}
      <div style={{ position:'absolute', top: 58, left: 0, right: 0, display:'flex', justifyContent:'space-between', padding:'0 20px'}}>
        <IconArrow dir="left" size={18}/>
        <div style={{ textAlign:'center'}}>
          <span className="tag"><span className="dot" style={{background:'var(--urgent)'}}/> align PAN · hold still</span>
        </div>
        <IconMore size={18}/>
      </div>

      {/* Steps */}
      <div style={{ position:'absolute', bottom: 170, left: 20, right: 20 }}>
        <div style={{ display:'flex', gap: 10, justifyContent:'center'}}>
          {['FRONT', 'BACK', 'CONFIRM'].map((s, i)=>(
            <div key={s} style={{ display:'flex', gap:6, alignItems:'center', color: i===0?'var(--ink)':'var(--ink-faint)'}}>
              <span style={{
                width: 20, height: 20, borderRadius: 10,
                border:`1.5px solid currentColor`,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: i===0 ? 'var(--ink)':'transparent',
                color: i===0 ? 'var(--bg)' : 'currentColor',
                fontSize: 10, fontFamily:'var(--mono)'
              }}>{i+1}</span>
              <span className="eyebrow" style={{ color:'currentColor'}}>{s}</span>
              {i<2 && <span style={{ width: 14, height: 1, background:'var(--line-strong)'}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* Shutter */}
      <div style={{ position:'absolute', bottom: 60, left: 0, right: 0, display:'flex', justifyContent:'center'}}>
        <div style={{
          width: 72, height: 72, borderRadius: 36,
          border: '3px solid var(--ink)', padding: 6
        }}>
          <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'var(--ink)'}}/>
        </div>
      </div>
    </div>
  </div>
);

// ─────────── CameraC — Captured, preview ────────────
const CameraC = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 4 }}>
        <IconArrow dir="left" size={18}/>
        <span className="eyebrow">Captured</span>
        <span className="tag"><span className="dot" style={{background:'var(--ok)'}}/> OCR 96%</span>
      </div>

      <div style={{ marginTop: 18 }}>
        <RenderCard c={PAY_CARDS[0]} full style={{ height: 208 }}/>
      </div>

      <div className="section-head"><h3 style={{ fontSize: 18 }}>Detected fields</h3></div>

      {[
        {l:'CARD NUMBER', v:'4210 9921 8713 8842', conf: 0.98, edited: false},
        {l:'HOLDER NAME', v:'AKASH VERMA', conf: 0.93, edited: false},
        {l:'EXPIRY',      v:'09 / 28', conf: 0.96, edited: false},
        {l:'ISSUER',      v:'HDFC Bank', conf: 0.88, edited: true},
      ].map(f => (
        <div key={f.l} style={{
          padding: 14, borderRadius: 'var(--r-md)',
          background:'var(--bg-raise)', border:'1px solid var(--line)',
          marginBottom: 8
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span className="eyebrow">{f.l}</span>
            <span style={{ fontFamily:'var(--mono)', fontSize: 9, color: f.conf > 0.9 ? 'var(--ok)' : 'var(--urgent)'}}>
              {Math.round(f.conf*100)}% {f.edited ? '· edited' : ''}
            </span>
          </div>
          <div style={{ fontFamily:'var(--mono)', fontSize: 14, marginTop: 8, letterSpacing:'0.04em'}}>
            {f.v}
          </div>
        </div>
      ))}

      <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
        <button style={{
          flex: 1, padding: 14, borderRadius: 99,
          background:'transparent', color:'var(--ink)', border:'1px solid var(--line-strong)',
          fontFamily:'var(--sans)', fontSize: 13
        }}>Retake</button>
        <button style={{
          flex: 2, padding: 14, borderRadius: 99,
          background:'var(--ink)', color:'var(--bg)', border:'none',
          fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500
        }}>Save to stack</button>
      </div>
    </div>
  </div>
);

// ─────────── Manual entry fallback (3 directions) ────────────
const ManualA = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll">
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: 4 }}>
        <IconArrow dir="left" size={18}/>
        <span className="eyebrow">manual entry</span>
      </div>

      <h1 className="serif-display" style={{ fontSize: 28, marginTop: 14 }}>
        Add manually.
      </h1>
      <p style={{ fontSize: 12, color:'var(--ink-faint)', marginTop: 6 }}>Or <span style={{ color:'var(--ink)', textDecoration:'underline'}}>scan with camera</span>.</p>

      <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap: 14 }}>
        <Field label="CARD NUMBER" value="4210 9921 8713 8842" focus/>
        <div style={{ display:'flex', gap: 10 }}>
          <Field label="EXPIRY" value="09 / 28" flex={1}/>
          <Field label="CVV" value="•••" flex={1}/>
        </div>
        <Field label="HOLDER" value="AKASH V."/>
        <Field label="NICKNAME" value="Daily drive"/>
      </div>

      <div style={{ marginTop: 20, padding: 12, borderRadius: 'var(--r-md)',
        background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)',
        display:'flex', gap: 10, alignItems:'center' }}>
        <IconSparkle size={16}/>
        <span style={{ fontSize: 12, color:'var(--ink-dim)'}}>
          AI detected <span style={{ color:'var(--ink)'}}>Visa · Debit · HDFC</span> from BIN. Tap to accept.
        </span>
      </div>

      <button style={{
        marginTop: 20, width:'100%', padding: 14, borderRadius: 99,
        background:'var(--ink)', color:'var(--bg)', border:'none',
        fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500
      }}>Save card</button>
    </div>
  </div>
);

const Field = ({ label, value, focus=false, flex=null }) => (
  <div style={{ flex: flex ?? undefined }}>
    <div className="eyebrow">{label}</div>
    <div style={{
      marginTop: 6, padding: '12px 14px',
      borderRadius: 10, background:'var(--bg-raise)',
      border:`1px solid ${focus ? 'var(--ink)' : 'var(--line)'}`,
      fontFamily:'var(--mono)', fontSize: 14, letterSpacing:'0.04em',
    }}>
      {value}{focus && <span style={{ display:'inline-block', width: 2, height: 14, background:'var(--ink)', marginLeft: 3, verticalAlign:'middle', animation:'wavepulse 1s infinite'}}/>}
    </div>
  </div>
);

const ManualB = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body" style={{ padding: 0 }}>
      <div style={{ padding:'8px 20px 0', display:'flex', justifyContent:'space-between'}}>
        <IconArrow dir="left" size={18}/>
        <span className="eyebrow">manual · step 2 / 3</span>
        <IconMore size={18}/>
      </div>

      {/* Live card preview */}
      <div style={{ padding:'24px 20px 16px'}}>
        <div className={'cc visa'} style={{ padding: 20, aspectRatio:1.586 }}>
          <div style={{ display:'flex', justifyContent:'space-between'}}>
            <div className="chip"/>
            <span style={{ fontFamily:'var(--mono)', fontSize: 11, color:'var(--ink-dim)'}}>VISA</span>
          </div>
          <div>
            <div className="num" style={{ fontSize: 15, opacity: 0.6 }}>4210 9921 87<span style={{ background:'rgba(255,255,255,0.14)', padding:'0 2px'}}>13 8842</span></div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop: 10 }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 8 }}>HOLDER</div>
                <div style={{ fontFamily:'var(--mono)', fontSize: 11, marginTop: 2, opacity: 0.4 }}>YOUR NAME</div>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 8 }}>EXP</div>
                <div style={{ fontFamily:'var(--mono)', fontSize: 11, marginTop: 2 }}>09/28</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Numeric pad */}
      <div style={{ padding:'0 20px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>ENTER LAST 4 DIGITS</div>
        <div style={{ display:'flex', gap: 10, marginBottom: 16 }}>
          {['1','3','8','4'].map((d,i)=>(
            <div key={i} style={{
              flex:1, aspectRatio: 1, borderRadius: 12,
              border:`1.5px solid ${i===3 ? 'var(--ink)' : 'var(--line-strong)'}`,
              background: i<3 ? 'var(--bg-raise)' : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--mono)', fontSize: 22,
            }}>{i<3 ? d : ''}{i===3 && <span style={{ width: 2, height: 20, background:'var(--ink)', animation:'wavepulse 1s infinite'}}/>}</div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k,i)=>(
            <div key={i} style={{
              aspectRatio: 1.7, borderRadius: 12,
              background: k ? 'var(--bg-raise)' : 'transparent',
              border: k ? '1px solid var(--line)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--mono)', fontSize: 20,
            }}>{k}</div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ManualC = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll">
      <div style={{ marginTop: 4, display:'flex', justifyContent:'space-between'}}>
        <IconArrow dir="left" size={18}/>
        <span className="eyebrow">new · PAN</span>
      </div>

      <div style={{ marginTop: 16, display:'flex', alignItems:'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background:'var(--bg-raise-2)', border:'1px solid var(--line)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <IconDoc size={22}/>
        </div>
        <div>
          <div className="eyebrow">Type</div>
          <div style={{ fontFamily:'var(--serif)', fontSize: 22, marginTop: 2 }}>PAN card</div>
        </div>
      </div>

      <div style={{ display:'flex', gap: 6, marginTop: 16, flexWrap:'wrap' }}>
        {['Credit','Debit','PAN','Aadhaar','Driving','Other'].map((t,i)=>(
          <span key={t} className="tag" style={{
            background: t==='PAN' ? 'var(--ink)' : 'var(--bg-raise)',
            color: t==='PAN' ? 'var(--bg)' : 'var(--ink-dim)',
            borderColor: t==='PAN' ? 'var(--ink)' : 'var(--line)'
          }}>{t}</span>
        ))}
      </div>

      <div style={{ marginTop: 22, display:'flex', flexDirection:'column', gap: 14 }}>
        <Field label="PAN NUMBER" value="ABCDE 1234 F" focus/>
        <Field label="NAME ON CARD" value="AKASH VERMA"/>
        <Field label="DATE OF BIRTH" value="14 · 03 · 1994"/>
        <Field label="FATHER'S NAME" value="RAJEEV VERMA"/>
      </div>

      <div style={{ display:'flex', gap: 10, marginTop: 18 }}>
        <div style={{
          flex: 1, aspectRatio: 1.586, borderRadius: 12,
          border: '1px dashed var(--line-strong)', background:'var(--bg-raise)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 6
        }}>
          <IconCard size={18}/>
          <span className="eyebrow">FRONT</span>
        </div>
        <div style={{
          flex: 1, aspectRatio: 1.586, borderRadius: 12,
          border: '1px dashed var(--line-strong)', background:'var(--bg-raise)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 6,
          opacity: 0.5
        }}>
          <IconPlus size={18}/>
          <span className="eyebrow">BACK (OPT)</span>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { CameraA, CameraB, CameraC, ManualA, ManualB, ManualC });
