// Notification scheduler. Watches store state and schedules local
// notifications for tasks with due times, P1 tasks without a time (morning
// nudge), enabled alarms (and a 2-minute pre-warn), and one-time reminders.
//
// All scheduling is local — no cloud push. On every store mutation we cancel
// all scheduled notifications and re-emit the current plan, which keeps the
// schedule consistent with the latest state.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import { useStore } from '../store';
import type { Alarm, Reminder, Task } from '../store/types';

const CHANNEL_ID = 'omni';
const MORNING_HOUR = 9;
const PRE_ALARM_MS = 2 * 60 * 1000;

let initialised = false;
let resyncTimer: ReturnType<typeof setTimeout> | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function initNotifications() {
  if (initialised) return;
  initialised = true;

  if (Platform.OS === 'web') return;

  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {}

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Omni reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 160, 180],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
      });
    } catch {}
  }

  scheduleResync();
  const unsub = useStore.subscribe((s) => {
    // Any change to tasks/alarms/reminders retriggers resync (debounced).
    void s.tasks;
    void s.alarms;
    void s.reminders;
    scheduleResync();
  });
  // Resync every 15 min in case the clock crossed a day boundary without a
  // state change — keeps HH:MM triggers pointing at the right day.
  setInterval(scheduleResync, 15 * 60 * 1000);
  // Return unsub for tests / future teardown.
  return unsub;
}

function scheduleResync() {
  if (resyncTimer) clearTimeout(resyncTimer);
  resyncTimer = setTimeout(() => {
    resyncTimer = null;
    void syncSchedules();
  }, 250);
}

export async function syncSchedules() {
  if (Platform.OS === 'web') return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== 'granted') return;
  } catch {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}

  const { tasks, alarms, reminders } = useStore.getState();
  const now = new Date();

  for (const t of tasks) if (!t.done) schedulesForTask(t, now).forEach(post);
  for (const a of alarms) if (a.enabled) schedulesForAlarm(a, now).forEach(post);
  for (const r of reminders) schedulesForReminder(r, now).forEach(post);
}

type Plan = {
  key: string;
  title: string;
  body: string;
  when: Date;
  data: Record<string, unknown>;
};

async function post(plan: Plan) {
  if (plan.when.getTime() <= Date.now() + 5_000) return;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: plan.key,
      content: {
        title: plan.title,
        body: plan.body,
        data: plan.data,
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: plan.when,
        channelId: CHANNEL_ID,
      },
    });
  } catch {}
}

// ── Rules ───────────────────────────────────────────────────────────────────

function schedulesForTask(t: Task, now: Date): Plan[] {
  const out: Plan[] = [];
  const time = parseHHMM(t.due);
  if (time) {
    const when = atNext(time.h, time.m, now);
    out.push({
      key: `task_due_${t.id}`,
      title: t.priority === 'P1' ? '⚠︎ P1 due now' : 'Task due',
      body: t.title,
      when,
      data: { kind: 'TASK', id: t.id, route: 'tab:tasks' },
    });
  } else if (t.priority === 'P1') {
    // No due time on a P1 — nudge at tomorrow morning (or today if before 9 AM).
    const when = atNext(MORNING_HOUR, 0, now);
    out.push({
      key: `task_p1_${t.id}`,
      title: 'P1 waiting',
      body: t.title,
      when,
      data: { kind: 'TASK', id: t.id, route: 'tab:tasks' },
    });
  }
  return out;
}

function schedulesForAlarm(a: Alarm, now: Date): Plan[] {
  const time = parseHHMM(a.time);
  if (!time) return [];
  const base = nextAlarmOccurrence(a, time, now);
  if (!base) return [];
  const preWarn = new Date(base.getTime() - PRE_ALARM_MS);
  return [
    {
      key: `alarm_pre_${a.id}`,
      title: 'Alarm in 2 min',
      body: a.label || 'Upcoming alarm',
      when: preWarn,
      data: { kind: 'ALARM', id: a.id, route: 'tab:alarms' },
    },
    {
      key: `alarm_at_${a.id}`,
      title: a.label || 'Alarm',
      body: `Ringing · ${a.time}`,
      when: base,
      data: { kind: 'ALARM', id: a.id, route: `/alarms/ringing?id=${a.id}` },
    },
  ];
}

function schedulesForReminder(r: Reminder, now: Date): Plan[] {
  const time = parseHHMM(r.at);
  if (!time) return [];
  const when = atNext(time.h, time.m, now);
  return [
    {
      key: `reminder_${r.id}`,
      title: 'Reminder',
      body: r.label,
      when,
      data: { kind: 'REMINDER', id: r.id },
    },
  ];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseHHMM(s?: string): { h: number; m: number } | undefined {
  if (!s) return undefined;
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (!m) return undefined;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mm)) return undefined;
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return undefined;
  return { h, m: mm };
}

function atNext(hour: number, min: number, now: Date): Date {
  const d = new Date(now);
  d.setHours(hour, min, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

const DAY_MAP: Record<string, number> = {
  Su: 0, M: 1, T: 2, W: 3, Th: 4, F: 5, Sa: 6,
};

function nextAlarmOccurrence(
  a: Alarm,
  time: { h: number; m: number },
  now: Date,
): Date | undefined {
  if (!a.days.length) {
    // One-time — fires the next time HH:MM rolls around.
    return atNext(time.h, time.m, now);
  }
  const allowed = new Set(a.days.map((d) => DAY_MAP[d]).filter((n) => n !== undefined));
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(time.h, time.m, 0, 0);
    if (allowed.has(d.getDay()) && d.getTime() > now.getTime()) return d;
  }
  return undefined;
}
