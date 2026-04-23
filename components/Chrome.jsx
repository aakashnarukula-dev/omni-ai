// Omni — shared chrome (status bar, tab bar, icons)

const StatusBar = ({ light = false }) => (
  <div className="statusbar" style={{ color: light ? '#fafafa' : '#fafafa' }}>
    <span>9:41</span>
    <span style={{ display:'flex', gap:8, alignItems:'center' }}>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M1 8 L3 6 M5 8 L8 5 M10 8 L13 4 M15 8 L15 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
        <path d="M7 3 Q10 0 13 3 M4 6 Q7 3 10 6 M7 8.5 L7 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <span style={{ fontFamily:'var(--mono)', fontSize: 11, border:'1px solid currentColor', padding:'1px 4px', borderRadius: 3, opacity: 0.9 }}>82</span>
    </span>
  </div>
);

// 5 tabs: Home, Tasks, Voice (center, primary), Alarms, Cards
const TabBar = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home',   label: 'Home',   icon: IconHome },
    { id: 'tasks',  label: 'Tasks',  icon: IconCheck },
    { id: 'voice',  label: '',       icon: IconMic, center: true },
    { id: 'alarms', label: 'Alarms', icon: IconBell },
    { id: 'cards',  label: 'Cards',  icon: IconCard },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <div key={t.id} className={`tab ${active === t.id ? 'active' : ''}`}>
          {t.center ? (
            <div style={{
              width: 48, height: 48, borderRadius: 24,
              background: 'var(--ink)', color: 'var(--bg)',
              display:'flex', alignItems:'center', justifyContent:'center',
              marginTop: -8, boxShadow:'0 8px 24px -6px rgba(250,250,250,0.35)'
            }}>
              <t.icon size={20} />
            </div>
          ) : (
            <>
              <t.icon size={18} />
              <span>{t.label}</span>
              <span className="dot" />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// ─────────── Icons (stroke-based, 1.5px) ───────────
function IconHome({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 11 L12 4 L21 11 V20 H15 V14 H9 V20 H3 Z" strokeLinejoin="round"/>
  </svg>
); }
function IconCheck({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="5" width="16" height="15" rx="2"/>
    <path d="M8 12 L11 15 L16 9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
); }
function IconMic({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="9" y="3" width="6" height="12" rx="3"/>
    <path d="M5 11 C5 15 8 17 12 17 C16 17 19 15 19 11" strokeLinecap="round"/>
    <path d="M12 17 L12 21 M8 21 H16" strokeLinecap="round"/>
  </svg>
); }
function IconCard({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="6" width="18" height="13" rx="2"/>
    <path d="M3 10 H21" />
  </svg>
); }
function IconVault({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="5" width="18" height="15" rx="2"/>
    <circle cx="12" cy="13" r="3"/>
    <path d="M12 13 L12 9 M12 13 L16 13"/>
  </svg>
); }
function IconSearch({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="7"/>
    <path d="M16 16 L21 21" strokeLinecap="round"/>
  </svg>
); }
function IconPlus({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 5 V19 M5 12 H19" strokeLinecap="round"/>
  </svg>
); }
function IconBell({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 16 V11 A6 6 0 0 1 18 11 V16 L20 18 H4 L6 16 Z" strokeLinejoin="round"/>
    <path d="M10 21 C10 22 11 22.5 12 22.5 C13 22.5 14 22 14 21" strokeLinecap="round"/>
  </svg>
); }
function IconClock({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7 V12 L15 14" strokeLinecap="round"/>
  </svg>
); }
function IconDoc({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 3 H14 L19 8 V21 H6 Z" strokeLinejoin="round"/>
    <path d="M14 3 V8 H19"/>
  </svg>
); }
function IconSparkle({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3 L13.5 9.5 L20 11 L13.5 12.5 L12 19 L10.5 12.5 L4 11 L10.5 9.5 Z" strokeLinejoin="round"/>
  </svg>
); }
function IconMore({ size = 18 }) { return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
  </svg>
); }
function IconArrow({ size = 18, dir='right' }) {
  const r = {right:0, up:-90, down:90, left:180}[dir];
  return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{transform:`rotate(${r}deg)`}}>
    <path d="M5 12 H19 M13 6 L19 12 L13 18" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
); }

// Waveform
const Waveform = ({ bars = 24, height = 80, color = '#fafafa', active = true, seed = 1 }) => {
  const items = Array.from({ length: bars });
  const random = (i) => {
    const x = Math.sin(i * 12.9898 * seed) * 43758.5453;
    return Math.abs(x - Math.floor(x));
  };
  return (
    <div className="wave" style={{ height, alignItems:'center' }}>
      {items.map((_, i) => {
        const h = 0.2 + random(i) * 0.95;
        return (
          <span key={i} className="bar" style={{
            height: `${Math.min(1, h) * 100}%`,
            background: color,
            animationDelay: `${(i % 8) * 0.09}s`,
            animationPlayState: active ? 'running' : 'paused',
            opacity: active ? 1 : 0.3,
          }} />
        );
      })}
    </div>
  );
};

// Make visible to other babel scripts
Object.assign(window, {
  StatusBar, TabBar, Waveform,
  IconHome, IconCheck, IconMic, IconCard, IconVault,
  IconSearch, IconPlus, IconBell, IconClock, IconDoc,
  IconSparkle, IconMore, IconArrow,
});
