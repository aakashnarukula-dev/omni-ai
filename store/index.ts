import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureStorage } from '../services/secure-storage';
import type {
  Task,
  Alarm,
  Reminder,
  PayCard,
  IdDoc,
  Note,
  VoiceState,
  ClassifiedItem,
  Tag,
  QueuedJob,
} from './types';
import {
  seedTasks,
  seedAlarms,
  seedReminders,
  seedPayCards,
  seedIdDocs,
  seedNotes,
} from './mockData';
import { armDeviceAlarm } from '../services/alarms';

// Flip on only for demos / screenshots. On a fresh install users see empty state.
const USE_SEED = process.env.EXPO_PUBLIC_SEED_DEMO === '1';

export type TabName = 'tasks' | 'alarms' | 'cards';
export const TAB_ORDER: TabName[] = ['tasks', 'alarms', 'cards'];

type State = {
  tasks: Task[];
  alarms: Alarm[];
  reminders: Reminder[];
  cards: PayCard[];
  docs: IdDoc[];
  notes: Note[];
  queued: QueuedJob[];

  tabIndex: number;
  setTabIndex: (i: number) => void;
  setTabByName: (name: TabName) => void;

  searchOpen: boolean;
  setSearchOpen: (b: boolean) => void;

  voice: {
    state: VoiceState;
    transcript: string;
    amplitude: number;
    classifications: ClassifiedItem[];
  };

  taskFilter: 'ALL' | 'P1' | 'P2' | 'P3' | Tag;

  toggleTask: (id: string) => void;
  setTaskFilter: (f: State['taskFilter']) => void;

  toggleAlarm: (id: string) => void;
  dismissAlarm: (id: string) => void;

  deleteTask: (id: string) => void;
  deleteAlarm: (id: string) => void;
  deleteNote: (id: string) => void;
  deleteCard: (id: string) => void;
  deleteDoc: (id: string) => void;
  deleteReminder: (id: string) => void;

  addCard: (c: PayCard) => void;
  addDoc: (d: IdDoc) => void;

  setVoiceState: (s: VoiceState) => void;
  setAmplitude: (n: number) => void;
  setTranscript: (s: string) => void;
  setClassifications: (items: ClassifiedItem[]) => void;
  acceptClassification: (id: string) => void;
  dismissClassification: (id: string) => void;
  commitClassifications: () => Promise<void>;
  resetVoice: () => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
  tasks: USE_SEED ? seedTasks : [],
  alarms: USE_SEED ? seedAlarms : [],
  reminders: USE_SEED ? seedReminders : [],
  cards: USE_SEED ? seedPayCards : [],
  docs: USE_SEED ? seedIdDocs : [],
  notes: USE_SEED ? seedNotes : [],
  queued: [],

  tabIndex: 0,
  setTabIndex: (tabIndex) =>
    set(() => ({ tabIndex: Math.max(0, Math.min(TAB_ORDER.length - 1, tabIndex)) })),
  setTabByName: (name) => set(() => ({ tabIndex: Math.max(0, TAB_ORDER.indexOf(name)) })),

  searchOpen: false,
  setSearchOpen: (searchOpen) => set(() => ({ searchOpen })),

  voice: {
    state: 'idle',
    transcript: '',
    amplitude: 0,
    classifications: [],
  },

  taskFilter: 'ALL',

  toggleTask: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })),

  setTaskFilter: (taskFilter) => set({ taskFilter }),

  toggleAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      ),
    })),

  dismissAlarm: (id) =>
    set((s) => ({
      alarms: s.alarms.map((a) =>
        a.id === id ? { ...a, enabled: false } : a
      ),
    })),

  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  deleteAlarm: (id) => set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) })),
  deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  deleteCard: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
  deleteDoc: (id) => set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
  deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

  addCard: (c) => set((s) => ({ cards: [c, ...s.cards] })),
  addDoc: (d) => set((s) => ({ docs: [d, ...s.docs] })),

  setVoiceState: (state) =>
    set((s) => ({ voice: { ...s.voice, state } })),
  setAmplitude: (amplitude) =>
    set((s) => ({ voice: { ...s.voice, amplitude } })),
  setTranscript: (transcript) =>
    set((s) => ({ voice: { ...s.voice, transcript } })),
  setClassifications: (classifications) =>
    set((s) => ({ voice: { ...s.voice, classifications } })),
  acceptClassification: (id) =>
    set((s) => ({
      voice: {
        ...s.voice,
        classifications: s.voice.classifications.map((c) =>
          c.id === id ? { ...c, accepted: true } : c
        ),
      },
    })),
  dismissClassification: (id) =>
    set((s) => ({
      voice: {
        ...s.voice,
        classifications: s.voice.classifications.filter((c) => c.id !== id),
      },
    })),
  commitClassifications: async () => {
    const { voice, tasks, alarms, notes } = get();
    const newTasks: Task[] = [...tasks];
    const newAlarms: Alarm[] = [...alarms];
    const newNotes: Note[] = [...notes];
    for (const c of voice.classifications) {
      if (!c.accepted) continue;
      if (c.kind === 'TASK') {
        newTasks.unshift({
          id: c.id,
          title: c.title,
          priority: c.priority ?? 'P2',
          tag: c.tag ?? '#personal',
          due: c.due,
          done: false,
          confidence: c.confidence,
        });
      } else if (c.kind === 'ALARM') {
        const time = c.due;
        if (!time) {
          // No parseable time — don't invent 08:00. Fall back to a task so
          // the user can add the time manually instead of waking at the wrong hour.
          newTasks.unshift({
            id: c.id,
            title: c.title || 'Set alarm',
            priority: 'P2',
            tag: '#personal',
            done: false,
            confidence: c.confidence,
          });
          continue;
        }
        const label = c.title || 'Alarm';
        let enabled = false;

        try {
          await armDeviceAlarm(time, label);
          enabled = true;
        } catch {}

        newAlarms.unshift({
          id: c.id,
          time,
          label,
          days: [],
          recurring: false,
          enabled,
        });
      } else if (c.kind === 'NOTE') {
        newNotes.unshift({
          id: c.id,
          body: c.title,
          tag: c.tag,
          createdAt: new Date().toISOString(),
        });
      }
    }
    set({
      tasks: newTasks,
      alarms: newAlarms,
      notes: newNotes,
      voice: {
        state: 'idle',
        transcript: '',
        amplitude: 0,
        classifications: [],
      },
    });
  },
  resetVoice: () =>
    set({
      voice: {
        state: 'idle',
        transcript: '',
        amplitude: 0,
        classifications: [],
      },
    }),
    }),
    {
      name: 'omni-store',
      version: 1,
      storage: createJSONStorage(() => secureStorage),
      // Only persist durable data; skip transient UI / voice state.
      partialize: (s) => ({
        tasks: s.tasks,
        alarms: s.alarms,
        reminders: s.reminders,
        cards: s.cards,
        docs: s.docs,
        notes: s.notes,
        queued: s.queued,
        taskFilter: s.taskFilter,
      }),
    }
  )
);
