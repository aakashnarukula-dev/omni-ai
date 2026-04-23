// Omni — Tasks, Alarms, Search. Notes removed (tasks + alarms cover it).

// ─────────── Tasks — Priority lanes with chip filters ────────────
const Tasks = () => {
  const [filter, setFilter] = React.useState('All');
  const chips = ['All','P1','P2','P3','#work','#home','#health','#bills'];

  const lanes = [
    { p:'P1 · urgent', color:'var(--urgent)', items:[
      { t:'Review Q2 design proposal', due:'11:30', tag:'#work',   p:'P1' },
      { t:'Finalize deck for Monday',  due:'Fri',   tag:'#work',   p:'P1' },
    ]},
    { p:'P2 · soon', color:'var(--ink)', items:[
      { t:'Call Priya — Stripe retry', due:'15:00', tag:'#work',   p:'P2' },
      { t:'Book dentist follow-up',    due:'today', tag:'#health', p:'P2' },
      { t:'Pay electricity bill',      due:'eve',   tag:'#bills',  p:'P2', done:true },
    ]},
    { p:'P3 · whenever', color:'var(--ink-faint)', items:[
      { t:'Buy milk + eggs',           due:'—',     tag:'#home',    p:'P3' },
      { t:'Submit expense report',     due:'Fri',   tag:'#finance', p:'P3' },
    ]},
  ];

  const passes = (it) => {
    if (filter === 'All') return true;
    if (filter.startsWith('P')) return it.p === filter;
    return it.tag === filter;
  };

  return (
    <div className="omni-screen">
      <StatusBar />
      <div className="omni-body scroll">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4 }}>
          <div>
            <div className="eyebrow">AI-sorted</div>
            <div style={{ fontFamily:'var(--serif)', fontSize: 26, marginTop: 4 }}>Priority queue</div>
          </div>
          <span className="tag"><IconSparkle size={10}/> auto</span>
        </div>

        {/* chip filters — from old TasksA */}
        <div style={{ display:'flex', gap: 6, marginTop: 16, flexWrap:'wrap' }}>
          {chips.map(t => {
            const active = filter === t;
            return (
              <span key={t} className="tag"
                onClick={() => setFilter(t)}
                style={{
                  cursor:'pointer',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--ink-dim)',
                  borderColor: active ? 'var(--ink)' : 'var(--line)'
                }}>{t}</span>
            );
          })}
        </div>

        {lanes.map(lane => {
          const items = lane.items.filter(passes);
          if (!items.length) return null;
          return (
            <div key={lane.p} style={{ marginTop: 22 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: lane.color }}/>
                <span className="eyebrow" style={{ color: lane.color }}>{lane.p}</span>
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
              </div>
              <div style={{ marginTop: 10, display:'flex', flexDirection:'column', gap: 6 }}>
                {items.map((it, i) => (
                  <div key={i} style={{
                    padding: 12, borderRadius: 10,
                    background:'var(--bg-raise)', border:'1px solid var(--line)',
                    display:'flex', alignItems:'center', gap: 10,
                    opacity: it.done ? 0.5 : 1
                  }}>
                    <div className={`check ${it.done?'done':''}`} style={{ width:16, height:16 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" stroke="var(--bg)" strokeWidth="3" fill="none"><path d="M5 12 L10 17 L19 7" strokeLinecap="round"/></svg>
                    </div>
                    <span className={it.done?'strike':''} style={{ flex: 1, fontSize: 13, textDecoration: it.done?'line-through':'none'}}>{it.t}</span>
                    <span className="eyebrow">{it.tag}</span>
                    <span className="eyebrow" style={{ width: 40, textAlign:'right'}}>{it.due}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <TabBar active="tasks" />
    </div>
  );
};

// ─────────── AlarmsA — Today's alarm timeline ────────────
const AlarmsA = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll">
      <div style={{ marginTop: 4, display:'flex', justifyContent:'space-between'}}>
        <div>
          <div className="eyebrow">Alarms</div>
          <div style={{ fontFamily:'var(--serif)', fontSize: 26, marginTop: 4 }}>Tuesday · today</div>
        </div>
        <div className="icon-btn"><IconPlus size={16}/></div>
      </div>

      <div style={{ marginTop: 18, position:'relative' }}>
        <div style={{ position:'absolute', left: 58, top: 0, bottom: 0, width: 1, background:'var(--line)' }}/>
        {[
          { time:'07:00', kind:'recur', title:'Wake up',              days:'weekdays',  done:true },
          { time:'11:30', kind:'once',  title:'Q2 proposal review',    tag:'#work',      urgent:true },
          { time:'13:00', kind:'recur', title:'Post-lunch walk',       days:'M W F' },
          { time:'15:00', kind:'once',  title:'Call Priya',            tag:'#work' },
          { time:'16:00', kind:'once',  title:'Dentist appointment',   tag:'#health' },
          { time:'18:00', kind:'once',  title:'Call mom',              tag:'#personal' },
          { time:'21:30', kind:'recur', title:'Wind down · phones off', days:'daily' },
        ].map((it, i) => (
          <div key={i} style={{ display:'flex', gap: 16, padding:'10px 0' }}>
            <div style={{ width: 50, fontFamily:'var(--mono)', fontSize: 11, color: it.done ? 'var(--ink-faint)' : 'var(--ink)', paddingTop: 14 }}>{it.time}</div>
            <div style={{ width: 18, display:'flex', justifyContent:'center', paddingTop: 16 }}>
              <div style={{
                width: 11, height: 11, borderRadius: it.kind==='recur' ? 2 : 6,
                background: it.urgent ? 'var(--urgent)' : it.done ? 'var(--ink-ghost)' : 'var(--ink)',
                border: '2px solid var(--bg)',
                boxShadow: `0 0 0 1.5px ${it.urgent?'var(--urgent)':it.done?'var(--ink-ghost)':'var(--ink)'}`
              }}/>
            </div>
            <div style={{ flex: 1, padding:'10px 14px', borderRadius: 12,
              background:'var(--bg-raise)', border:'1px solid var(--line)',
              opacity: it.done ? 0.5 : 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between'}}>
                <span className={it.done?'strike':''} style={{ fontSize: 13, textDecoration: it.done?'line-through':'none'}}>{it.title}</span>
                {it.kind==='recur' ? <IconClock size={12}/> : <IconBell size={12}/>}
              </div>
              <div style={{ display:'flex', gap: 6, marginTop: 4 }}>
                {it.tag && <span className="eyebrow">{it.tag}</span>}
                {it.days && <span className="eyebrow">· {it.days}</span>}
                {it.urgent && <span className="eyebrow" style={{ color:'var(--urgent)'}}>· urgent</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <TabBar active="alarms" />
  </div>
);

// ─────────── AlarmsB — Alarm clock list ────────────
const AlarmsB = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body scroll">
      <div style={{ marginTop: 4 }}>
        <div className="eyebrow">Alarms</div>
        <div className="serif-display" style={{ fontSize: 56, marginTop: 8, fontFamily:'var(--mono)', fontWeight: 300 }}>07:00</div>
        <div className="eyebrow" style={{ marginTop: 4 }}>next · in 21 hr 19 min · WEEKDAYS</div>
      </div>

      <div style={{ marginTop: 26, display:'flex', flexDirection:'column', gap: 10 }}>
        {[
          { time:'07:00', label:'Morning', days:'M T W T F', on:true },
          { time:'13:00', label:'Post-lunch walk', days:'M W F', on:true },
          { time:'21:30', label:'Wind down', days:'Every day', on:false },
          { time:'05:45', label:'Gym · Saturday', days:'S', on:true },
        ].map((a,i)=>(
          <div key={i} style={{
            padding:'14px 16px', borderRadius:'var(--r-md)',
            background:'var(--bg-raise)', border:'1px solid var(--line)',
            display:'flex', alignItems:'center', gap: 14,
            opacity: a.on ? 1 : 0.45
          }}>
            <div>
              <div style={{ fontFamily:'var(--mono)', fontSize: 22 }}>{a.time}</div>
              <div className="eyebrow" style={{ marginTop: 2 }}>{a.days}</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize: 13 }}>{a.label}</div>
            </div>
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: a.on ? 'var(--ink)' : 'var(--line-strong)',
              padding: 2, display:'flex', justifyContent: a.on ? 'flex-end':'flex-start'
            }}>
              <div style={{ width: 16, height: 16, borderRadius:8, background: a.on ? 'var(--bg)' : 'var(--ink)'}}/>
            </div>
          </div>
        ))}
      </div>

      <div className="section-head"><h3 style={{ fontSize: 18 }}>One-time</h3></div>
      {[
        { t:'Dentist appointment', at:'16:00 today', done: false },
        { t:'Pay electricity bill', at:'done 08:14', done: true },
      ].map((r,i)=>(
        <div key={i} className="row-card" style={{ opacity: r.done ? 0.5 : 1, marginBottom: 8 }}>
          <div className="leading"><IconBell size={16}/></div>
          <div style={{ flex:1 }}>
            <div className={r.done?'strike':''} style={{ fontSize: 13, textDecoration: r.done?'line-through':'none' }}>{r.t}</div>
            <div className="eyebrow" style={{ marginTop: 2 }}>{r.at}</div>
          </div>
        </div>
      ))}
    </div>
    <TabBar active="alarms" />
  </div>
);

// ─────────── AlarmsC — Active ringing alarm sheet ────────────
const AlarmsC = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body" style={{ padding: 0, display:'flex', flexDirection:'column' }}>
      <div style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap: 20, padding: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <IconBell size={14}/>
          <span className="eyebrow">alarm · ringing</span>
        </div>
        <div className="serif-display" style={{ fontSize: 44, textAlign:'center', lineHeight: 1.05 }}>
          Dentist<br/>appointment
        </div>
        <div className="eyebrow" style={{ color:'var(--urgent)'}}>16:00 · in 5 min</div>

        <div style={{ marginTop: 8, padding: 14, borderRadius: 'var(--r-md)',
          background:'rgba(255,255,255,0.03)', border:'1px solid var(--line)',
          maxWidth: 300, display:'flex', gap: 10, alignItems:'flex-start' }}>
          <IconSparkle size={14}/>
          <span style={{ fontSize: 12, color:'var(--ink-dim)', lineHeight: 1.5 }}>
            Clinic is 12 min away. Leave now to be on time.
          </span>
        </div>

        <div style={{ marginTop: 14, display:'flex', gap: 10, width:'100%' }}>
          <button style={{
            flex: 1, padding:'14px', borderRadius: 99,
            background:'transparent', color:'var(--ink)',
            border:'1px solid var(--line-strong)',
            fontFamily:'var(--sans)', fontSize: 13
          }}>Snooze 10m</button>
          <button style={{
            flex: 1, padding:'14px', borderRadius: 99,
            background:'var(--ink)', color:'var(--bg)',
            border:'none',
            fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500
          }}>Mark done</button>
        </div>
      </div>
    </div>
  </div>
);

// ─────────── Search — Voice-first, answer card + tabs + results ────────────
const Search = () => {
  const [tab, setTab] = React.useState('All');
  const results = [
    { kind:'TASK',  tab:'Tasks',  t:'Call Priya about Stripe retry', sub:'#work · P2 · 15:00' },
    { kind:'ALARM', tab:'Alarms', t:'Dentist appointment',           sub:'16:00 · today' },
    { kind:'CARD',  tab:'Cards',  t:'HDFC Debit ••8842',             sub:'scanned 22 Apr' },
    { kind:'DOC',   tab:'Docs',   t:'PAN — ABCDE1234F',              sub:'identity · 2 photos' },
  ];
  const tabs = ['All','Tasks','Alarms','Cards','Docs'];
  const filtered = tab === 'All' ? results : results.filter(r => r.tab === tab);

  return (
    <div className="omni-screen">
      <StatusBar />
      <div className="omni-body scroll" style={{ display:'flex', flexDirection:'column', paddingBottom: 20 }}>
        <div style={{ marginTop: 4, display:'flex', justifyContent:'space-between' }}>
          <IconArrow dir="left" size={18}/>
          <span className="tag"><span className="dot" style={{ background:'var(--ok)'}}/> listening</span>
        </div>

        {/* The voice question */}
        <div style={{ marginTop: 36, textAlign:'center' }}>
          <div className="eyebrow">ask Omni</div>
          <div style={{ fontFamily:'var(--serif)', fontSize: 26, lineHeight: 1.2, padding:'18px 10px 0' }}>
            "What did I say about<br/>the <span style={{ background:'rgba(250,250,250,0.15)', padding:'0 6px'}}>Stripe retry</span> idea?"
          </div>
        </div>

        <div style={{ padding:'28px 20px 0'}}>
          <Waveform bars={26} height={48} seed={1.6}/>
        </div>

        {/* AI answer card */}
        <div style={{
          marginTop: 26, padding: 14, borderRadius: 'var(--r-md)',
          background:'var(--bg-raise)', border:'1px solid var(--line)',
          display:'flex', gap: 12
        }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background:'var(--ink)', color:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <IconSparkle size={12}/>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            You noted it Tuesday morning — <span style={{ color:'var(--ink-dim)'}}>"Exponential backoff, cap at 6 attempts. Log dead-letter to Sentry."</span> Tagged <span className="tag" style={{ padding:'0 5px', fontSize: 9 }}>#eng</span>, due Friday.
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap: 6, marginTop: 22, flexWrap:'wrap' }}>
          {tabs.map(t => {
            const active = tab === t;
            const n = t === 'All' ? results.length : results.filter(r => r.tab === t).length;
            return (
              <span key={t} className="tag"
                onClick={() => setTab(t)}
                style={{
                  cursor:'pointer',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--ink-dim)',
                  borderColor: active ? 'var(--ink)' : 'var(--line)'
                }}>{t} {n > 0 && <span style={{ opacity: 0.6, marginLeft: 2 }}>{n}</span>}</span>
            );
          })}
        </div>

        {/* Results list at bottom */}
        <div style={{ marginTop: 14 }}>
          {filtered.map((r,i)=>(
            <div key={i} className="row-card" style={{ marginBottom: 8 }}>
              <div className="leading"><span style={{ fontFamily:'var(--mono)', fontSize: 9 }}>{r.kind}</span></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize: 13 }}>{r.t}</div>
                <div className="eyebrow" style={{ marginTop: 3 }}>{r.sub}</div>
              </div>
              <IconArrow size={14}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  Tasks,
  AlarmsA, AlarmsB, AlarmsC,
  Search,
});
