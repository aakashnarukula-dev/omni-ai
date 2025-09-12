// Omni design tokens — port of design_handoff_omni/mocks/styles.css
// Do not invent new values.

export const colors = {
  bg: '#0a0a0b',
  bgRaise: '#141416',
  bgRaise2: '#1c1c20',
  bgRaise3: '#26262b',

  ink: '#fafafa',
  inkDim: 'rgba(250,250,250,0.62)',
  inkFaint: 'rgba(250,250,250,0.38)',
  inkGhost: 'rgba(250,250,250,0.18)',

  line: 'rgba(255,255,255,0.07)',
  lineStrong: 'rgba(255,255,255,0.14)',

  accent: '#fafafa',
  urgent: '#f5a524',
  ok: '#7ee787',
  danger: '#ff6b6b',

  cardVisa: ['#1a1a22', '#0a0a0b'] as const,
  cardMc: ['#3a2a1a', '#1a0f08'] as const,
  cardRupay: ['#14281f', '#07120c'] as const,
  cardPan: ['#122028', '#070d10'] as const,
  cardOther: ['#2a1f2e', '#120a14'] as const,
  cardAadhaar: ['#5a2e0f', '#2a1505'] as const,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Geist_400Regular',
  sansMedium: 'Geist_500Medium',
  sansSemibold: 'Geist_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

// Type scale — unitless (RN pt).
export const type = {
  display44: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 46 },
  display32: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 36 },
  display28: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32 },
  display26: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 },
  display24: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 28 },

  body14: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  body13: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  body12: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 },

  mono15: { fontFamily: fonts.mono, fontSize: 15, letterSpacing: 1.5 },
  mono12: { fontFamily: fonts.mono, fontSize: 12 },
  mono11: { fontFamily: fonts.mono, fontSize: 11 },
  mono10: { fontFamily: fonts.mono, fontSize: 10 },

  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 0.72,
    textTransform: 'uppercase' as const,
  },
} as const;

export const spacing = {
  screenX: 20,
  tabBarHeight: 78,
  statusBarHeight: 44,
} as const;

// ISO/IEC 7810 ID-1 ratio — every card-shaped element uses this.
export const CARD_ASPECT = 1.586;
