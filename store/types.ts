export type Priority = 'P1' | 'P2' | 'P3';

export type Tag =
  | '#work'
  | '#home'
  | '#health'
  | '#bills'
  | '#finance'
  | '#personal'
  | '#ideas'
  | '#eng';

export const ALL_TAGS: Tag[] = [
  '#work',
  '#home',
  '#health',
  '#bills',
  '#finance',
  '#personal',
  '#ideas',
  '#eng',
];

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  tag: Tag;
  due?: string;
  done: boolean;
  confidence?: number;
};

export type Alarm = {
  id: string;
  time: string;
  label: string;
  days: ('M' | 'T' | 'W' | 'Th' | 'F' | 'Sa' | 'Su')[];
  recurring: boolean;
  enabled: boolean;
};

export type Reminder = {
  id: string;
  at: string;
  label: string;
};

export type CardBrand = 'visa' | 'mc' | 'rupay' | 'other';
export type CardType = 'credit' | 'debit' | 'other';

// Full PAN and CVV are NEVER stored here. PAN lives in expo-secure-store
// under `card_<id>_pan`. CVV is never persisted (PCI DSS 3.2).
export type PayCard = {
  id: string;
  kind: 'pay';
  brand: CardBrand;
  cardType?: CardType;
  last4: string;
  holder: string;
  expiry: string;
  issuer?: string;
  network?: string;
  lastUsed?: string;
  limitHint?: string;
  confidence?: number;
  /** Gradient sampled from the physical card photo. Overrides brand palette. */
  accent?: readonly [string, string];
};

export type IdKind = 'pan' | 'aadhaar' | 'dl';

// Full document number lives in expo-secure-store under `doc_<id>_num`.
// IdDoc holds only the masked number for display.
export type IdDoc = {
  id: string;
  kind: 'id';
  docKind: IdKind;
  maskedNumber: string;
  name: string;
  frontUri: string;
  backUri?: string;
  lastVerified?: string;
  confidence?: number;
};

export type StackItem = PayCard | IdDoc;

export type Note = {
  id: string;
  body: string;
  tag?: Tag;
  createdAt: string;
};

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'classifying'
  | 'done';

export type ClassifiedItem = {
  id: string;
  kind: 'TASK' | 'ALARM' | 'NOTE' | 'CARD';
  title: string;
  priority?: Priority;
  due?: string;
  tag?: Tag;
  confidence: number;
  accepted: boolean;
};

export type QueuedJob =
  | { kind: 'stt'; audioUri: string; createdAt: number }
  | { kind: 'classify'; transcript: string; createdAt: number }
  | { kind: 'brief'; ctx: unknown; createdAt: number };
