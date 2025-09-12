// Omni AI layer.
//
// Each call either hits the real provider (when env is configured) or falls
// back to a canned mock. Per AI_ARCHITECTURE.md, this lets the UI stay
// deterministic in dev while one stub at a time gets swapped.

import { Platform } from 'react-native';
import type { ClassifiedItem, IdKind, Priority, Tag } from '../store/types';
import { classifyLocally } from './classify';

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL?.replace(/\/$/, '') ?? '';
const DEEPGRAM_KEY = process.env.EXPO_PUBLIC_DEEPGRAM_API_KEY ?? '';
const DEEPGRAM_MODEL = process.env.EXPO_PUBLIC_DEEPGRAM_MODEL ?? 'nova-3';

const hasProxy = PROXY_URL.length > 0;
const hasDeepgram = DEEPGRAM_KEY.length > 0;
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === '1';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

async function postProxy<T>(task: string, payload: unknown): Promise<T> {
  const res = await fetch(`${PROXY_URL}/api/ai/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ task, payload }),
  });
  if (!res.ok) {
    throw new Error(`proxy ${task} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── Speech to text ─────────────────────────────────────────────────────────
export type STTHandle = {
  stop: () => Promise<string>;
  onInterim: (cb: (text: string) => void) => void;
  onAmplitude: (cb: (amp: number) => void) => void;
};

const MOCK_DICTATION =
  "Call Priya about the Stripe retry issue by 3pm today. Also set an alarm " +
  "for 6:30 am tomorrow. And remind me — exponential backoff, cap six attempts.";

/**
 * Mock STT — fake word-by-word stream + amplitude jitter. Used in web and
 * whenever Deepgram isn't configured.
 */
export function startMockSTT(): STTHandle {
  let interimCb: ((t: string) => void) | null = null;
  let ampCb: ((a: number) => void) | null = null;
  let stopped = false;

  const words = MOCK_DICTATION.split(' ');
  let soFar = '';
  let i = 0;
  const tick = () => {
    if (stopped) return;
    if (i < words.length) {
      soFar = soFar ? `${soFar} ${words[i]}` : words[i];
      i += 1;
      interimCb?.(soFar);
    }
    setTimeout(tick, 180 + Math.random() * 180);
  };
  setTimeout(tick, 300);

  const ampTick = () => {
    if (stopped) return;
    ampCb?.(0.2 + Math.random() * 0.8);
    setTimeout(ampTick, 60);
  };
  setTimeout(ampTick, 60);

  return {
    stop: async () => {
      stopped = true;
      return soFar || MOCK_DICTATION;
    },
    onInterim: (cb) => {
      interimCb = cb;
    },
    onAmplitude: (cb) => {
      ampCb = cb;
    },
  };
}

/**
 * POST a recorded file to Deepgram's prerecorded endpoint. Used by the voice
 * screen after recording stops.
 */
export async function transcribeAudioFile(uri: string, contentType = 'audio/m4a'): Promise<string> {
  if (!hasDeepgram) {
    await sleep(400);
    return MOCK_DICTATION;
  }
  const body = await (await fetch(uri)).blob();
  const url = `https://api.deepgram.com/v1/listen?model=${encodeURIComponent(DEEPGRAM_MODEL)}&smart_format=true&punctuate=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DEEPGRAM_KEY}`,
      'Content-Type': contentType,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`deepgram ${res.status}`);
  }
  const json = (await res.json()) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{ transcript?: string }>;
      }>;
    };
  };
  return json.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
}

export const sttCapabilities = {
  realAvailable: hasDeepgram && Platform.OS !== 'web',
  model: DEEPGRAM_MODEL,
};

// ── Classification (Gemini 2.5 Flash via proxy) ─────────────────────────────
export async function classifyTranscript(transcript: string): Promise<ClassifiedItem[]> {
  if (hasProxy) {
    try {
      const { items } = await postProxy<{ items: Array<Record<string, unknown>> }>('classify', { transcript });
      return items.map((raw) => {
        const kindRaw = String(raw.kind ?? '').toUpperCase();
        const kind: ClassifiedItem['kind'] =
          kindRaw === 'TASK' || kindRaw === 'ALARM' || kindRaw === 'NOTE' || kindRaw === 'CARD'
            ? (kindRaw as ClassifiedItem['kind'])
            : 'NOTE';
        const priRaw = raw.priority ? String(raw.priority).toUpperCase() : undefined;
        const priority =
          priRaw === 'P1' || priRaw === 'P2' || priRaw === 'P3' ? (priRaw as Priority) : undefined;
        return {
          id: uid('x'),
          kind,
          title: String(raw.title ?? ''),
          priority,
          due: raw.due ? String(raw.due) : undefined,
          tag: (raw.tag as Tag | undefined) ?? undefined,
          confidence: Number(raw.confidence ?? 0.8),
          accepted: Number(raw.confidence ?? 0.8) >= 0.85,
        };
      });
    } catch (err) {
      console.warn('proxy classify failed:', err);
    }
  }
  if (USE_MOCKS) return mockClassify(transcript);
  if (!transcript) return [];
  return classifyLocally(transcript);
}

export async function mockClassify(_transcript: string): Promise<ClassifiedItem[]> {
  await sleep(400);
  const make = (
    kind: ClassifiedItem['kind'],
    title: string,
    opts: Partial<ClassifiedItem> = {}
  ): ClassifiedItem => ({
    id: uid('x'),
    kind,
    title,
    confidence: 0.92,
    accepted: true,
    ...opts,
  });
  return [
    make('TASK', 'Call Priya about Stripe retry', {
      priority: 'P1',
      tag: '#work',
      due: '15:00',
      confidence: 0.94,
    }),
    make('ALARM', 'Morning alarm', { due: '06:30', confidence: 0.97 }),
    make('NOTE', 'Exponential backoff, cap six attempts', {
      tag: '#eng',
      confidence: 0.72,
      accepted: false,
    }),
  ];
}

// ── Daily brief ─────────────────────────────────────────────────────────────
export async function getDailyBrief(): Promise<string> {
  if (hasProxy) {
    try {
      const { brief } = await postProxy<{ brief: string }>('brief', {
        localTime: new Date().toLocaleString(),
        todayTasks: [],
        todayAlarms: [],
        overdue: [],
      });
      return brief;
    } catch (err) {
      console.warn('proxy brief failed:', err);
    }
  }
  if (USE_MOCKS) return mockBrief();
  return 'Welcome. Tap the mic to capture a task, an alarm, or a stray thought.';
}

export async function mockBrief(): Promise<string> {
  await sleep(280);
  return 'Three P1 items today — the Stripe call at 3, the electricity bill, and rent on the 30th. Clinic at 2. Everything else is soft.';
}

// ── Search ──────────────────────────────────────────────────────────────────
export type SearchResult = {
  id: string;
  kind: 'TASK' | 'ALARM' | 'CARD' | 'DOC' | 'NOTE';
  title: string;
  meta?: string;
};

export async function askOmni(
  question: string,
  items: SearchResult[] = []
): Promise<{ answer: string; results: SearchResult[] }> {
  if (hasProxy) {
    try {
      const { answer } = await postProxy<{ answer: string }>('search', {
        question,
        items: items.map((r) => ({ kind: r.kind, title: r.title, meta: r.meta })),
      });
      return { answer, results: items };
    } catch (err) {
      console.warn('proxy search failed:', err);
    }
  }
  if (USE_MOCKS) return mockSearch(question);
  return { answer: '(Cloud Run proxy not configured — configure EXPO_PUBLIC_PROXY_URL to enable AI search)', results: items };
}

export async function mockSearch(question: string): Promise<{ answer: string; results: SearchResult[] }> {
  await sleep(350);
  const q = question.toLowerCase();
  const base: SearchResult[] = [
    { id: 'r1', kind: 'TASK', title: 'Call Priya about Stripe retry', meta: 'P1 · #work · 15:00' },
    { id: 'r2', kind: 'NOTE', title: 'Exponential backoff, cap 6 attempts', meta: '#eng · 3d ago' },
    { id: 'r3', kind: 'ALARM', title: 'Standup · 09:00', meta: 'M–F recurring' },
    { id: 'r4', kind: 'CARD', title: 'HDFC Visa ·· 8842', meta: 'Used today at Swiggy' },
  ];
  const filtered = base.filter((r) =>
    q
      ? r.title.toLowerCase().includes(q.split(' ')[0]) || q.includes(r.kind.toLowerCase())
      : true
  );
  const results = filtered.length ? filtered : base.slice(0, 2);
  const answer = results.length
    ? `You mentioned the Stripe retry twice — once as a task for 3 PM and once as a note about capping retries at six with 10% jitter.`
    : `Nothing matched that phrase. Try a keyword like "stripe" or "rent".`;
  return { answer, results };
}

// ── OCR (on-device ML Kit — stubbed until dev-client build) ─────────────────
export type OcrField = {
  label: string;
  value: string;
  confidence: number;
};

export async function mockOcrCard(): Promise<OcrField[]> {
  await sleep(600);
  return [
    { label: 'Number', value: '4532 •••• •••• 8842', confidence: 0.93 },
    { label: 'Holder', value: 'AAKASH NARUKULA', confidence: 0.88 },
    { label: 'Expiry', value: '08/29', confidence: 0.82 },
    { label: 'Network', value: 'VISA', confidence: 0.97 },
  ];
}

export async function mockOcrId(kind: IdKind): Promise<OcrField[]> {
  await sleep(550);
  if (kind === 'pan') {
    return [
      { label: 'Number', value: 'AKPXX1234Y', confidence: 0.91 },
      { label: 'Name', value: 'AAKASH NARUKULA', confidence: 0.86 },
      { label: 'DOB', value: '1998-07-15', confidence: 0.74 },
    ];
  }
  if (kind === 'aadhaar') {
    return [
      { label: 'Number', value: '5612 3456 9012', confidence: 0.89 },
      { label: 'Name', value: 'AAKASH NARUKULA', confidence: 0.84 },
    ];
  }
  return [
    { label: 'Number', value: 'TS01 20230012345', confidence: 0.82 },
    { label: 'Class', value: 'LMV', confidence: 0.7 },
  ];
}
