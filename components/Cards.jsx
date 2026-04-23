// Omni — Cards + ID photos. Everything on the face, no flip, no Face-ID-per-card.
// Pay cards (credit/debit) render as virtual cards.
// PAN / Aadhaar / Driving licence render as PHYSICAL PHOTOS (front + back).

// ─────────── Data ────────────
const PAY_CARDS = [
  { id:'hdfc',  k:'pay', label:'HDFC DEBIT',  num:'4210 9921 8713 8842', name:'AKASH V.', exp:'09/28', cvv:'•••', cls:'visa', brand:'VISA', type:'DEBIT'  },
  { id:'icici', k:'pay', label:'ICICI CREDIT',num:'5428 3390 1184 2210', name:'AKASH V.', exp:'11/27', cvv:'•••', cls:'mc',   brand:'MASTERCARD', type:'CREDIT' },
];
const ID_DOCS = [
  { id:'pan',     k:'id', label:'PAN card',         kind:'PAN',     caption:'ABCDE1234F',   color:'#c8a57a' },
  { id:'aadhaar', k:'id', label:'Aadhaar',          kind:'AADHAAR', caption:'•••• •••• 7721', color:'#b8b0a0' },
  { id:'dl',      k:'id', label:'Driving licence',  kind:'DL',      caption:'DL-06 2022',   color:'#a89d88' },
];
const ALL_CARDS = [...PAY_CARDS, ...ID_DOCS]; // stack order top→down

// ─────────── RenderCard — virtual pay card (front only) ────────────
const RenderCard = ({ c, style, full=false }) => (
  <div className={`cc ${c.cls}`} style={{ padding: full ? 22 : 18, ...style }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div className="chip"/>
      <span style={{ fontFamily:'var(--mono)', fontSize: 10, letterSpacing:'0.1em', color:'var(--ink-dim)'}}>{c.brand}</span>
    </div>
    <div>
      <div className="num" style={{ fontSize: full ? 18 : 14, letterSpacing: '0.1em' }}>{c.num}</div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop: 12, gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ fontSize: 8 }}>HOLDER</div>
          <div style={{ fontFamily:'var(--mono)', fontSize: 11, marginTop: 2 }}>{c.name}</div>
        </div>
        <div>
          <div className="eyebrow" style={{ fontSize: 8 }}>EXP</div>
          <div style={{ fontFamily:'var(--mono)', fontSize: 11, marginTop: 2 }}>{c.exp}</div>
        </div>
        <div>
          <div className="eyebrow" style={{ fontSize: 8 }}>CVV</div>
          <div style={{ fontFamily:'var(--mono)', fontSize: 11, marginTop: 2 }}>{c.cvv}</div>
        </div>
      </div>
    </div>
  </div>
);

// ─────────── RenderIDPhoto — physical photo placeholder ────────────
// Represents an actual captured photo of a physical document.
// `side` = 'front' | 'back'. Uses placeholder-stripe pattern for "this is a photo placeholder".
const RenderIDPhoto = ({ doc, side='front', full=false, style }) => (
  <div style={{
    position:'relative',
    aspectRatio: '1.58/1',
    borderRadius: full ? 14 : 12,
    background: `linear-gradient(135deg, ${doc.color}22, ${doc.color}10)`,
    border: '1px solid var(--line)',
    overflow:'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    ...style
  }}>
    {/* photographic placeholder pattern */}
    <div style={{
      position:'absolute', inset: 0,
      backgroundImage:
        'repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 8px, rgba(255,255,255,0) 8px 16px),'+
        'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.04), transparent 40%)',
    }}/>

    {/* photo corners */}
    {['tl','tr','bl','br'].map(pos => {
      const [v,h] = pos.split('');
      return <div key={pos} style={{
        position:'absolute',
        [v==='t'?'top':'bottom']: 8,
        [h==='l'?'left':'right']: 8,
        width: 10, height: 10,
        borderTop: v==='t' ? '1px solid rgba(255,255,255,0.3)' : 'none',
        borderBottom: v==='b' ? '1px solid rgba(255,255,255,0.3)' : 'none',
        borderLeft: h==='l' ? '1px solid rgba(255,255,255,0.3)' : 'none',
        borderRight: h==='r' ? '1px solid rgba(255,255,255,0.3)' : 'none',
      }}/>;
    })}

    {/* doc label */}
    <div style={{
      position:'absolute', top: 14, left: 14, right: 14,
      display:'flex', justifyContent:'space-between', alignItems:'flex-start'
    }}>
      <div>
        <div style={{ fontFamily:'var(--mono)', fontSize: 9, letterSpacing:'0.14em', color:'rgba(255,255,255,0.55)' }}>{doc.kind}</div>
        <div style={{ fontFamily:'var(--serif)', fontSize: full ? 16 : 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontStyle:'italic' }}>
          {doc.label}
        </div>
      </div>
      <div style={{ fontFamily:'var(--mono)', fontSize: 8, letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', padding:'2px 6px', border:'1px solid rgba(255,255,255,0.15)', borderRadius: 3 }}>
        {side.toUpperCase()}
      </div>
    </div>

    {/* center "PHOTO" placeholder mark */}
    <div style={{
      position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--mono)', fontSize: 9, color:'rgba(255,255,255,0.25)', letterSpacing:'0.2em'
    }}>{side === 'front' ? '▢ PHOTO · FRONT' : '▢ PHOTO · BACK'}</div>

    {/* bottom caption */}
    <div style={{
      position:'absolute', bottom: 14, left: 14, right: 14,
      display:'flex', justifyContent:'space-between', alignItems:'flex-end'
    }}>
      <span style={{ fontFamily:'var(--mono)', fontSize: 10, color:'rgba(255,255,255,0.7)' }}>{doc.caption}</span>
      <span style={{ fontFamily:'var(--mono)', fontSize: 8, color:'rgba(255,255,255,0.35)' }}>captured · 22·04·26</span>
    </div>
  </div>
);

// ─────────── RenderStackItem — unified stack item ────────────
const RenderStackItem = ({ c, style, full=false }) =>
  c.k === 'id'
    ? <RenderIDPhoto doc={c} side="front" full={full} style={style}/>
    : <RenderCard c={c} full={full} style={style}/>;

// ─────────── StackB — Tight stack (only direction) ────────────
// Pay cards + ID photos layered.
const StackB = () => (
  <div className="omni-screen">
    <StatusBar />
    <div className="omni-body">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4 }}>
        <span className="eyebrow">{ALL_CARDS.length} items</span>
        <div style={{ display:'flex', gap: 6 }}>
          <div className="icon-btn"><IconSearch size={14}/></div>
          <div className="icon-btn"><IconPlus size={14}/></div>
        </div>
      </div>

      <h1 className="serif-display" style={{ fontSize: 32, marginTop: 10 }}>Stack.</h1>
      <div className="eyebrow" style={{ marginTop: 6 }}>
        2 cards · 3 IDs
      </div>

      <div style={{ position:'relative', height: 480, marginTop: 32 }}>
        {ALL_CARDS.map((c, i) => (
          <div key={c.id} style={{
            position:'absolute', left: 0, right: 0,
            top: i * 34,
            margin:'0 auto',
            width: `${100 - i*2.2}%`,
            transform: `scale(${1 - i*0.012})`,
            transformOrigin: 'top center',
            filter: i > 0 ? `brightness(${1 - i*0.08})` : 'none',
            zIndex: ALL_CARDS.length - i,
          }}>
            <RenderStackItem c={c} />
          </div>
        ))}
      </div>
    </div>
    <TabBar active="cards" />
  </div>
);

// ─────────── DetailA — Pay card: card + Copy + Share ────────────
const DetailA = () => {
  const c = PAY_CARDS[0];
  return (
    <div className="omni-screen">
      <StatusBar />
      <div className="omni-body" style={{ display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 4 }}>
          <IconArrow dir="left" size={18}/>
          <span className="eyebrow">HDFC · debit</span>
          <IconMore size={16}/>
        </div>

        <div style={{ marginTop: 48, padding:'0 4px' }}>
          <RenderCard c={c} full style={{ height: 220 }}/>
        </div>

        <div style={{ marginTop: 36, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          <button style={{
            padding:'18px 12px', borderRadius:'var(--r-md)',
            background:'var(--ink)', color:'var(--bg)', border:'none',
            display:'flex', gap: 8, alignItems:'center', justifyContent:'center',
            fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500
          }}><IconDoc size={14}/> Copy number</button>
          <button style={{
            padding:'18px 12px', borderRadius:'var(--r-md)',
            background:'var(--bg-raise)', color:'var(--ink)', border:'1px solid var(--line-strong)',
            display:'flex', gap: 8, alignItems:'center', justifyContent:'center',
            fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500
          }}><IconArrow size={14} dir="up"/> Share</button>
        </div>

        <div style={{ flex: 1 }}/>
      </div>
    </div>
  );
};

// ─────────── DetailC — ID doc: front + back photos + Copy + Share ────────────
const DetailC = () => {
  const doc = ID_DOCS[0]; // PAN
  return (
    <div className="omni-screen">
      <StatusBar />
      <div className="omni-body scroll">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 4 }}>
          <IconArrow dir="left" size={18}/>
          <span className="eyebrow">{doc.label}</span>
          <IconMore size={16}/>
        </div>

        <div style={{ marginTop: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>front</div>
          <RenderIDPhoto doc={doc} side="front" full/>
        </div>
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>back</div>
          <RenderIDPhoto doc={doc} side="back" full/>
        </div>

        <div style={{ marginTop: 24, display:'flex', gap: 10 }}>
          <button style={{
            flex: 1,
            padding:'18px 12px', borderRadius:'var(--r-md)',
            background:'var(--ink)', color:'var(--bg)', border:'none',
            display:'flex', gap: 8, alignItems:'center', justifyContent:'center',
            fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500
          }}><IconArrow size={14} dir="up"/> Share front + back</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  StackB, DetailA, DetailC,
  RenderCard, RenderIDPhoto, RenderStackItem,
  PAY_CARDS, ID_DOCS, ALL_CARDS,
});
