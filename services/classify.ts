import type { ClassifiedItem, Priority, Tag } from '../store/types';

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

const ALARM_RE = /\b(alarm|wake me|wake up|set (a|an) (alarm|timer))\b/i;
const REMIND_RE = /\b(remind me|reminder|remember to|don't forget)\b/i;
const NOTE_MARK_RE = /^\s*(note[: ]|save a note|write down|jot down|remember that|fyi[, ]|keep in mind|for the record)/i;
const TASK_RE = /\b(call|email|text|reply|send|pay|book|buy|schedule|meet|finish|submit|review|write|fix|update|check|clean|wash|cook|bake|do|take|get|pick|drop|bring|grab|order|make|plan|prepare|start|complete|study|read|learn|practice|workout|exercise|walk|feed|water|charge|lock|close|open|message|ping|visit|see|go|return|renew|cancel|print|scan|download|upload|install|deploy|merge|push|pull|test|sign|verify|confirm|apply|file)\b/i;

const IMPERATIVE_START_RE = /^(go|get|buy|bring|grab|take|make|do|cook|clean|wash|read|write|send|call|email|text|pay|fix|check|finish|submit|review|update|book|order|plan|pick|drop|lock|close|open|study|learn|practice|start|complete|prepare|message|ping|walk|run|feed|water|charge|print|scan|download|upload|install|deploy|test|sign|verify|confirm|apply|file|visit|see|return|renew|cancel|schedule|meet)\b/i;

const TIME_PATTERNS: RegExp[] = [
  /\b(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?\b/i,
  /\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)\b/i,
  /\bat\s+(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b/i,
];

const RELATIVE_IN = /\bin\s+(\d+)\s+(minute|minutes|min|mins|hour|hours|hr|hrs)\b/i;

const WORD_NUMS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  half: 30, quarter: 15,
};

const RELATIVE_IN_WORDS = /\bin\s+(?:(a|an|half|quarter|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty)(?:[\s-](one|two|three|four|five|six|seven|eight|nine))?)\s+(minute|minutes|min|mins|hour|hours|hr|hrs)\b/i;

const HOUR_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  noon: 12, midnight: 0,
};

const MIN_WORDS: Record<string, number> = {
  oclock: 0, "o'clock": 0, sharp: 0,
  fifteen: 15, thirty: 30, 'forty-five': 45, 'fortyfive': 45,
};

const WORD_CLOCK_RE = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|noon|midnight)(?:[\s-]?(fifteen|thirty|forty[-\s]?five|o'?clock|sharp))?\s*(am|pm|a\.m\.|p\.m\.|in the morning|in the afternoon|in the evening|at night|tonight)?\b/i;

const HALF_PAST_RE = /\b(half|quarter)\s+(past|to)\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;

const TAGS: Array<{ re: RegExp; tag: Tag }> = [
  { re: /\b(work|office|meeting|boss|client|stripe|slack|deploy|pr|pull request)\b/i, tag: '#work' },
  { re: /\b(rent|bill|bills|electricity|water|gas|mortgage|loan|pay)\b/i, tag: '#bills' },
  { re: /\b(doctor|clinic|medicine|gym|workout|run|meditate|dentist|health)\b/i, tag: '#health' },
  { re: /\b(home|chore|groceries|laundry|clean|kitchen)\b/i, tag: '#home' },
];

function parseTimeToHHMM(input: string, now: Date = new Date()): string | undefined {
  const rel = input.match(RELATIVE_IN);
  if (rel) {
    const n = Number(rel[1]);
    const unit = rel[2].toLowerCase();
    const mins = unit.startsWith('h') ? n * 60 : n;
    const t = new Date(now.getTime() + mins * 60_000);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }
  const relWords = input.match(RELATIVE_IN_WORDS);
  if (relWords) {
    const base = WORD_NUMS[relWords[1].toLowerCase()] ?? 0;
    const extra = relWords[2] ? WORD_NUMS[relWords[2].toLowerCase()] ?? 0 : 0;
    const n = base + extra;
    const unit = relWords[3].toLowerCase();
    const mins = unit.startsWith('h') ? n * 60 : n;
    if (n > 0) {
      const t = new Date(now.getTime() + mins * 60_000);
      return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }
  }
  for (const re of TIME_PATTERNS) {
    const m = input.match(re);
    if (!m) continue;
    let hour = Number(m[1]);
    const minuteRaw = m[2];
    const ampm = (m[3] ?? m[2] ?? '').toLowerCase();
    let minute = minuteRaw && /^\d+$/.test(minuteRaw) ? Number(minuteRaw) : 0;
    if (Number.isNaN(hour)) continue;
    if (ampm.startsWith('p') && hour < 12) hour += 12;
    if (ampm.startsWith('a') && hour === 12) hour = 0;
    // "in the morning" / "in the evening" etc. carry AM/PM hints.
    const suffix = detectDaypartHint(input);
    if (!ampm && suffix) {
      if (suffix === 'pm' && hour < 12) hour += 12;
      if (suffix === 'am' && hour === 12) hour = 0;
    }
    if (hour < 0 || hour > 23) continue;
    if (minute < 0 || minute > 59) minute = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // Word-form clocks: "five", "five thirty", "five am", "eleven in the morning".
  const halfPast = input.match(HALF_PAST_RE);
  if (halfPast) {
    const base = HOUR_WORDS[halfPast[3].toLowerCase()] ?? 0;
    const minutes = halfPast[1].toLowerCase() === 'quarter' ? 15 : 30;
    let hour = halfPast[2].toLowerCase() === 'to' ? base - 1 : base;
    if (hour < 0) hour += 12;
    const mins = halfPast[2].toLowerCase() === 'to' ? 60 - minutes : minutes;
    const suf = detectDaypartHint(input);
    if (suf === 'pm' && hour < 12) hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  const wc = input.match(WORD_CLOCK_RE);
  if (wc) {
    let hour = HOUR_WORDS[wc[1].toLowerCase()];
    const rawMin = wc[2]?.toLowerCase().replace(/\s+/g, '-') ?? '';
    const minute = MIN_WORDS[rawMin] ?? 0;
    const amPmRaw = wc[3]?.toLowerCase();
    const suf = daypartToAmPm(amPmRaw);
    if (suf === 'pm' && hour < 12) hour += 12;
    if (suf === 'am' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return undefined;
}

function detectDaypartHint(input: string): 'am' | 'pm' | undefined {
  return daypartToAmPm(
    input.match(/in the morning|in the afternoon|in the evening|at night|tonight/i)?.[0]
  );
}

function daypartToAmPm(hint?: string): 'am' | 'pm' | undefined {
  if (!hint) return undefined;
  const h = hint.toLowerCase();
  if (h === 'am' || h === 'a.m.' || h.includes('morning')) return 'am';
  if (h === 'pm' || h === 'p.m.' || h.includes('afternoon') || h.includes('evening') || h.includes('night')) return 'pm';
  return undefined;
}

function pickTag(s: string): Tag | undefined {
  for (const { re, tag } of TAGS) {
    if (re.test(s)) return tag;
  }
  return undefined;
}

function pickPriority(s: string): Priority | undefined {
  if (/\b(urgent|asap|immediately|right now|right away)\b/i.test(s)) return 'P1';
  if (/\b(soon|this afternoon|today)\b/i.test(s)) return 'P2';
  return undefined;
}

function splitSegments(transcript: string): string[] {
  return transcript
    .split(/\s+(?:and|also|then|plus)\s+/i)
    .flatMap((seg) => seg.split(/[.;]\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function cleanTitle(s: string): string {
  return s
    .replace(/^\s*(also|and|then|plus|please)\s+/i, '')
    .replace(/\b(remind me to|remind me|remember to|don't forget to|set an? alarm for|set an? alarm at|set an? alarm|wake me up at|wake me at)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function classifyLocally(transcript: string): ClassifiedItem[] {
  if (!transcript.trim()) return [];
  const segments = splitSegments(transcript);
  const items: ClassifiedItem[] = [];
  for (const raw of segments) {
    const s = raw.trim();
    const time = parseTimeToHHMM(s);

    if (ALARM_RE.test(s)) {
      if (!time) {
        // Alarm intent without a recognised time — emit a task so the user
        // isn't silently scheduled for a default hour.
        items.push({
          id: uid('x'),
          kind: 'TASK',
          title: cleanTitle(s) || 'Set alarm',
          priority: 'P2',
          tag: '#personal',
          confidence: 0.6,
          accepted: true,
        });
        continue;
      }
      items.push({
        id: uid('x'),
        kind: 'ALARM',
        title: cleanTitle(s) || 'Alarm',
        due: time,
        confidence: 0.92,
        accepted: true,
      });
      continue;
    }

    if (REMIND_RE.test(s)) {
      items.push({
        id: uid('x'),
        kind: 'TASK',
        title: cleanTitle(s),
        due: time,
        priority: pickPriority(s) ?? 'P2',
        tag: pickTag(s) ?? '#personal',
        confidence: 0.88,
        accepted: true,
      });
      continue;
    }

    if (NOTE_MARK_RE.test(s)) {
      items.push({
        id: uid('x'),
        kind: 'NOTE',
        title: cleanTitle(s).slice(0, 200),
        tag: pickTag(s),
        confidence: 0.78,
        accepted: true,
      });
      continue;
    }

    items.push({
      id: uid('x'),
      kind: 'TASK',
      title: cleanTitle(s),
      due: time,
      priority: pickPriority(s) ?? 'P2',
      tag: pickTag(s) ?? '#personal',
      confidence: TASK_RE.test(s) || time || IMPERATIVE_START_RE.test(s.trim()) ? 0.86 : 0.7,
      accepted: true,
    });
  }
  return items;
}
