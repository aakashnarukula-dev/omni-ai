// Command parser — detects destructive/CRUD voice commands and resolves
// which entities in the store they target. The confirm screen takes a
// ParsedCommand and actually executes it (no side-effects here).

import * as FileSystem from 'expo-file-system/legacy';

import { useStore } from '../store';
import { deleteSecret } from './secure';
import type { Match, MatchKind } from './assistant';

export type CommandAction = 'delete';
export type CommandTarget = MatchKind | 'REMINDER' | 'ALL';

export type ParsedCommand = {
  action: CommandAction;
  target: CommandTarget;
  scope: 'all' | 'keyword';
  keywords: string[];
  matches: Match[];
  summary: string;
};

const COMMAND_RE =
  /\b(delete|remove|clear|cancel|erase|drop|trash|wipe(?:\s+out)?|get\s+rid\s+of)\b/i;

const STOP = new Set([
  'delete','remove','clear','cancel','erase','drop','trash','wipe','out','get','rid','of',
  'the','a','an','all','every','everything','my','please','omni','some','any','each','these','those',
  'and','or','also','too','just','now','also','with','from','to','for','on','in','at','about','that','this',
  'alarms','alarm','tasks','task','todos','todo','cards','card','docs','doc','documents','document',
  'notes','note','reminders','reminder','ids','id','picture','pictures','photo','photos','image','images',
]);

export function looksLikeCommand(t: string): boolean {
  return COMMAND_RE.test(t);
}

export function parseCommand(transcript: string): ParsedCommand | null {
  if (!looksLikeCommand(transcript)) return null;
  const lower = transcript.toLowerCase();

  const hits = {
    alarm: /\balarms?\b|\bwake[- ]?ups?\b|\btimers?\b/.test(lower),
    task: /\btasks?\b|\btodos?\b|\bto[- ]?dos?\b|\bchores?\b/.test(lower),
    card: /\bcards?\b|\bcredit\s*cards?\b|\bdebit\s*cards?\b/.test(lower),
    doc: /\bpan\b|\baadhaar\b|\bdl\b|\bdriving\s+li[cs]ense\b|\bdocuments?\b|\bids?\b|\bpictures?\b|\bphotos?\b/.test(lower),
    note: /\bnotes?\b/.test(lower),
    reminder: /\breminders?\b/.test(lower),
  };
  const everything = /\beverything\b|\ball\s+my\s+data\b|\bmy\s+whole\b/.test(lower);
  const allModifier = /\ball\b|\bevery\b|\beverything\b/.test(lower);

  const targetFlags = Object.entries(hits).filter(([, v]) => v);
  let target: CommandTarget;
  if (everything) target = 'ALL';
  else if (targetFlags.length === 0) target = 'ALL';
  else if (targetFlags.length > 1) target = 'ALL';
  else {
    const k = targetFlags[0][0];
    target =
      k === 'alarm' ? 'ALARM'
        : k === 'task' ? 'TASK'
        : k === 'card' ? 'CARD'
        : k === 'doc' ? 'DOC'
        : k === 'note' ? 'NOTE'
        : 'REMINDER';
  }

  const keywords = lower
    .replace(/[.,?!;:'"]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOP.has(w));

  const scope: ParsedCommand['scope'] =
    allModifier && keywords.length === 0 ? 'all' : keywords.length ? 'keyword' : 'all';

  const matches = resolveMatches(target, scope, keywords);

  let summary: string;
  if (matches.length === 0) summary = 'Nothing matching found.';
  else if (scope === 'all') summary = `${matches.length} ${targetLabel(target, matches.length)}`;
  else summary = `${matches.length} ${targetLabel(target, matches.length)} matching “${keywords.join(' ')}”`;

  return { action: 'delete', target, scope, keywords, matches, summary };
}

function targetLabel(t: CommandTarget, n: number): string {
  const plural = n === 1 ? '' : 's';
  switch (t) {
    case 'ALARM': return `alarm${plural}`;
    case 'TASK': return `task${plural}`;
    case 'CARD': return `card${plural}`;
    case 'DOC': return `document${plural}`;
    case 'NOTE': return `note${plural}`;
    case 'REMINDER': return `reminder${plural}`;
    case 'ALL': return `item${plural}`;
  }
}

function resolveMatches(
  target: CommandTarget,
  scope: ParsedCommand['scope'],
  keywords: string[],
): Match[] {
  const s = useStore.getState();
  const all: Match[] = [];

  const addAlarms = () =>
    s.alarms.forEach((a) =>
      all.push({
        id: a.id,
        kind: 'ALARM',
        title: a.label || 'Alarm',
        meta: `${a.time} · ${a.enabled ? 'armed' : 'off'}`,
      }),
    );
  const addTasks = () =>
    s.tasks.forEach((t) =>
      all.push({
        id: t.id,
        kind: 'TASK',
        title: t.title,
        meta: `${t.priority}${t.tag ? ' · ' + t.tag : ''}${t.due ? ' · ' + t.due : ''}`,
      }),
    );
  const addCards = () =>
    s.cards.forEach((c) =>
      all.push({
        id: c.id,
        kind: 'CARD',
        title: [c.issuer, c.network].filter(Boolean).join(' ') || c.brand.toUpperCase(),
        meta: `·· ${c.last4} · ${c.holder}`,
      }),
    );
  const addDocs = () =>
    s.docs.forEach((d) =>
      all.push({
        id: d.id,
        kind: 'DOC',
        title: d.name,
        meta: `${d.docKind.toUpperCase()} · ${d.maskedNumber}`,
      }),
    );
  const addNotes = () =>
    s.notes.forEach((n) =>
      all.push({ id: n.id, kind: 'NOTE', title: n.body, meta: n.tag }),
    );

  switch (target) {
    case 'ALARM': addAlarms(); break;
    case 'TASK': addTasks(); break;
    case 'CARD': addCards(); break;
    case 'DOC': addDocs(); break;
    case 'NOTE': addNotes(); break;
    case 'REMINDER': break; // reminders not surfaced as Match kind yet
    case 'ALL':
      addAlarms(); addTasks(); addCards(); addDocs(); addNotes();
      break;
  }

  if (scope === 'all' || keywords.length === 0) return all;
  return all.filter((m) => {
    const hay = `${m.title} ${m.meta ?? ''}`.toLowerCase();
    return keywords.some((k) => hay.includes(k));
  });
}

// ── Execution ───────────────────────────────────────────────────────────────

export async function executeCommand(cmd: ParsedCommand) {
  const s = useStore.getState();
  for (const m of cmd.matches) {
    switch (m.kind) {
      case 'ALARM':
        s.deleteAlarm(m.id);
        break;
      case 'TASK':
        s.deleteTask(m.id);
        break;
      case 'NOTE':
        s.deleteNote(m.id);
        break;
      case 'CARD':
        try { await deleteSecret(`card_${m.id}_pan`); } catch {}
        s.deleteCard(m.id);
        break;
      case 'DOC': {
        const d = useStore.getState().docs.find((x) => x.id === m.id);
        if (d) {
          if (d.frontUri) try { await FileSystem.deleteAsync(d.frontUri, { idempotent: true }); } catch {}
          if (d.backUri) try { await FileSystem.deleteAsync(d.backUri, { idempotent: true }); } catch {}
        }
        try { await deleteSecret(`doc_${m.id}_num`); } catch {}
        s.deleteDoc(m.id);
        break;
      }
    }
  }
}
