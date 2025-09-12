import { NativeModules, Platform } from 'react-native';
import type { Alarm } from '../store/types';

const DAY_TO_CALENDAR: Record<Alarm['days'][number], number> = {
  Su: 1,
  M: 2,
  T: 3,
  W: 4,
  Th: 5,
  F: 6,
  Sa: 7,
};

type OmniAlarmNativeModule = {
  setAlarm: (
    hour: number,
    minute: number,
    label: string | null,
    skipUi: boolean,
    vibrate: boolean,
    days: number[] | null
  ) => Promise<boolean>;
  showAlarms: () => Promise<boolean>;
};

const nativeAlarmModule = NativeModules.OmniAlarmModule as OmniAlarmNativeModule | undefined;

function parseHHMM(input?: string): { hour: number; minute: number } | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  const am = s.includes('am');
  const pm = s.includes('pm');
  const clean = s.replace(/am|pm/g, '').trim();
  const [h, m] = clean.split(':');
  let hour = Number(h);
  const minute = Number(m ?? 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (pm && hour < 12) hour += 12;
  if (am && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function requireNativeAlarmModule(): OmniAlarmNativeModule {
  if (!nativeAlarmModule) {
    throw new Error('OmniAlarmModule is unavailable');
  }
  return nativeAlarmModule;
}

export async function armDeviceAlarm(
  time: string,
  label: string,
  recurring = false,
  days: Alarm['days'] = []
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('armDeviceAlarm: Android only');
  }

  const parsed = parseHHMM(time);
  if (!parsed) {
    throw new Error(`armDeviceAlarm: cannot parse time "${time}"`);
  }

  const repeatDays = recurring ? days.map((day) => DAY_TO_CALENDAR[day]) : [];
  await requireNativeAlarmModule().setAlarm(
    parsed.hour,
    parsed.minute,
    label || 'Omni alarm',
    true,
    true,
    repeatDays.length ? repeatDays : null
  );
}

export async function openDeviceClock(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await requireNativeAlarmModule().showAlarms();
}
