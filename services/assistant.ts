// Assistant — routes voice/text queries through the store and (optionally) a
// proxy LLM. Returns a natural-language answer plus the matching entities
// so the UI can render search-style results.

import { useStore } from '../store';
import type { PayCard, IdDoc, Task, Alarm, Note } from '../store/types';

export type MatchKind = 'TASK' | 'ALARM' | 'CARD' | 'DOC' | 'NOTE';

export type Match = {
  id: string;
  kind: MatchKind;
  title: string;
  meta?: string;
};

export type AssistantResult = {
  answer: string;
  matches: Match[];
  usedProxy: boolean;
};

const QUESTION_START_RE =
  /^\s*(what|what's|whats|how|how's|hows|when|where|who|which|why|do\s|does\s|did\s|is\s|are\s|am\s|was\s|were\s|can\s|could\s|should\s|tell\s|show\s|list\s|find\s|search|give\s+me\b|any\s)/i;

export function looksLikeQuestion(t: string): boolean {
  const s = t.trim();
  if (!s) return false;
  if (s.endsWith('?')) return true;
  return QUESTION_START_RE.test(s);
}

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL?.replace(/\/$/, '') ?? '';
const hasProxy = PROXY_URL.length > 0;

function formatTask(t: Task): Match {
  const bits: string[] = [t.priority];
  if (t.tag) bits.push(t.tag);
  if (t.due) bits.push(t.due);
  if (t.done) bits.push('done');
  return { id: t.id, kind: 'TASK', title: t.title, meta: bits.join(' · ') };
}

function formatAlarm(a: Alarm): Match {
  const bits: string[] = [a.time, a.enabled ? 'armed' : 'off'];
  if (a.days.length) bits.push(a.days.join(''));
  return { id: a.id, kind: 'ALARM', title: a.label || 'Alarm', meta: bits.join(' · ') };
}

function formatCard(c: PayCard): Match {
  const title = [c.issuer, c.network].filter(Boolean).join(' ') || c.brand.toUpperCase();
  const meta = `·· ${c.last4} · ${c.holder} · ${c.expiry}`;
  return { id: c.id, kind: 'CARD', title, meta };
}

function formatDoc(d: IdDoc): Match {
  return {
    id: d.id,
    kind: 'DOC',
    title: d.name,
    meta: `${d.docKind.toUpperCase()} · ${d.maskedNumber}`,
  };
}

function formatNote(n: Note): Match {
  return { id: n.id, kind: 'NOTE', title: n.body, meta: n.tag };
}

function buildCorpus(): Match[] {
  const s = useStore.getState();
  return [
    ...s.tasks.map(formatTask),
    ...s.alarms.map(formatAlarm),
    ...s.cards.map(formatCard),
    ...s.docs.map(formatDoc),
    ...s.notes.map(formatNote),
  ];
}

function detectTopic(q: string) {
  const l = q.toLowerCase();
  return {
    alarm: /\balarms?\b|\bwake ?ups?\b|\btimers?\b/.test(l),
    task: /\btasks?\b|\btodos?\b|\bto[- ]?dos?\b|\bthings to do\b|\bchores?\b/.test(l),
    card: /\bcards?\b|\bcredit\s*cards?\b|\bdebit\s*cards?\b|\bvisa\b|\bmastercard\b|\brupay\b/.test(l),
    doc: /\bpan\b|\baadhaar\b|\b(driving )?li[cs]ense\b|\bdl\b|\bdocuments?\b|\bids?\b/.test(l),
    note: /\bnotes?\b/.test(l),
    today: /\btoday\b|\bcurrent\b|\bnow\b/.test(l),
    p1: /\bp1\b|\burgent\b|\bhigh priority\b/.test(l),
  };
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[.,?!;:]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the','and','for','with','have','has','had','are','was','were','what','how','when','where','who','which','why',
  'any','many','much','this','that','these','those','tell','show','list','find','search','give','get','need','want',
  'know','does','did','can','could','should','would','about','from','into','over','under','just','also','please','omni',
  'today','tomorrow','yesterday','there','their','theirs','mine','your','yours','our','ours','some','none','all','every',
]);

function keywordMatch(q: string, corpus: Match[]): Match[] {
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  const scored: { m: Match; score: number }[] = [];
  for (const m of corpus) {
    const hay = `${m.title} ${m.meta ?? ''}`.toLowerCase();
    let score = 0;
    for (const t of tokens) if (hay.includes(t)) score += 1;
    if (score > 0) scored.push({ m, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 12).map((s) => s.m);
}

function localAnswer(q: string): AssistantResult {
  const state = useStore.getState();
  const topic = detectTopic(q);
  const corpus = buildCorpus();
  const tasks = state.tasks;
  const alarms = state.alarms;
  const cards = state.cards;
  const docs = state.docs;
  const notes = state.notes;

  const countSentence = /\bhow many\b|\bcount\b|\bnumber of\b/i.test(q);
  const listSentence = /\bwhat('?s| is| are)\b|\bshow\b|\blist\b|\btell me\b|\bgive me\b|\bmy\b/i.test(q);

  if (topic.alarm && (countSentence || listSentence || !Object.values(topic).some(Boolean))) {
    const armed = alarms.filter((a) => a.enabled);
    const target = topic.today ? armed : alarms;
    const answer =
      target.length === 0
        ? 'No alarms set.'
        : countSentence
        ? `You have ${alarms.length} alarm${alarms.length === 1 ? '' : 's'} — ${armed.length} armed.`
        : `${armed.length} armed out of ${alarms.length}. Next: ${nextAlarmLabel(armed)}.`;
    return { answer, matches: target.map(formatAlarm), usedProxy: false };
  }

  if (topic.task && (countSentence || listSentence || !Object.values(topic).some(Boolean))) {
    let target = tasks;
    if (topic.p1) target = target.filter((t) => t.priority === 'P1');
    const open = target.filter((t) => !t.done);
    const answer =
      target.length === 0
        ? 'No tasks yet.'
        : countSentence
        ? `${open.length} open task${open.length === 1 ? '' : 's'}${topic.p1 ? ' at P1' : ''} out of ${target.length}.`
        : `${open.length} open${topic.p1 ? ' P1' : ''} task${open.length === 1 ? '' : 's'}: ${open.slice(0, 3).map((t) => t.title).join('; ')}${open.length > 3 ? '…' : '.'}`;
    return { answer, matches: target.map(formatTask), usedProxy: false };
  }

  if (topic.card) {
    const answer =
      cards.length === 0
        ? 'No cards saved.'
        : countSentence
        ? `${cards.length} card${cards.length === 1 ? '' : 's'} saved.`
        : `${cards.length} card${cards.length === 1 ? '' : 's'}: ${cards.map((c) => `${c.network ?? c.brand.toUpperCase()} ·· ${c.last4}`).join(', ')}.`;
    return { answer, matches: cards.map(formatCard), usedProxy: false };
  }

  if (topic.doc) {
    const answer =
      docs.length === 0
        ? 'No ID documents saved.'
        : countSentence
        ? `${docs.length} document${docs.length === 1 ? '' : 's'} saved.`
        : `${docs.length} document${docs.length === 1 ? '' : 's'}: ${docs.map((d) => d.docKind.toUpperCase()).join(', ')}.`;
    return { answer, matches: docs.map(formatDoc), usedProxy: false };
  }

  if (topic.note) {
    const answer =
      notes.length === 0
        ? 'No notes yet.'
        : countSentence
        ? `${notes.length} note${notes.length === 1 ? '' : 's'}.`
        : `${notes.length} note${notes.length === 1 ? '' : 's'}. Most recent: "${notes[0].body.slice(0, 80)}".`;
    return { answer, matches: notes.map(formatNote), usedProxy: false };
  }

  // Generic keyword search.
  const matches = keywordMatch(q, corpus);
  const answer = matches.length
    ? `Found ${matches.length} item${matches.length === 1 ? '' : 's'} matching that.`
    : "I couldn't find anything matching that in your Omni data.";
  return { answer, matches, usedProxy: false };
}

function nextAlarmLabel(armed: Alarm[]): string {
  if (!armed.length) return 'none';
  const sorted = [...armed].sort((a, b) => a.time.localeCompare(b.time));
  const a = sorted[0];
  return `${a.label || 'Alarm'} at ${a.time}`;
}

export async function answerQuestion(transcript: string): Promise<AssistantResult> {
  const local = localAnswer(transcript);
  if (!hasProxy) return local;
  try {
    const res = await fetch(`${PROXY_URL}/api/ai/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        task: 'assistant',
        payload: {
          question: transcript,
          items: buildCorpus(),
        },
      }),
    });
    if (!res.ok) throw new Error(`proxy ${res.status}`);
    const json = (await res.json()) as { answer?: string; matchIds?: string[] };
    const corpus = buildCorpus();
    const matches = json.matchIds
      ? corpus.filter((m) => json.matchIds!.includes(m.id))
      : local.matches;
    return {
      answer: json.answer ?? local.answer,
      matches,
      usedProxy: true,
    };
  } catch {
    return local;
  }
}
