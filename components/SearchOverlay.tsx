import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, radii, spacing, type } from '../theme';
import { Eyebrow } from './Eyebrow';
import { IconArrow, IconSearch } from './Icons';
import { useStore } from '../store';
import type { Match } from '../services/assistant';

const KIND_COLOR: Record<Match['kind'], string> = {
  TASK: colors.ink,
  ALARM: colors.ok,
  CARD: colors.ink,
  DOC: colors.ink,
  NOTE: colors.inkDim,
};

export function SearchOverlay() {
  const router = useRouter();
  const open = useStore((s) => s.searchOpen);
  const setOpen = useStore((s) => s.setSearchOpen);
  const setTabByName = useStore((s) => s.setTabByName);
  const tasks = useStore((s) => s.tasks);
  const alarms = useStore((s) => s.alarms);
  const cards = useStore((s) => s.cards);
  const docs = useStore((s) => s.docs);
  const notes = useStore((s) => s.notes);

  const [q, setQ] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      // Slight delay lets the blur mount before keyboard animation.
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open, setOpen]);

  const results = useMemo<Match[]>(() => {
    const needle = q.trim().toLowerCase();
    const all: Match[] = [
      ...tasks.map((t) => ({
        id: t.id,
        kind: 'TASK' as const,
        title: t.title,
        meta: [t.priority, t.tag, t.due, t.done ? 'done' : null].filter(Boolean).join(' · '),
      })),
      ...alarms.map((a) => ({
        id: a.id,
        kind: 'ALARM' as const,
        title: a.label || 'Alarm',
        meta: `${a.time} · ${a.enabled ? 'armed' : 'off'}`,
      })),
      ...cards.map((c) => ({
        id: c.id,
        kind: 'CARD' as const,
        title: [c.issuer, c.network].filter(Boolean).join(' ') || c.brand.toUpperCase(),
        meta: `·· ${c.last4} · ${c.holder}`,
      })),
      ...docs.map((d) => ({
        id: d.id,
        kind: 'DOC' as const,
        title: d.name,
        meta: `${d.docKind.toUpperCase()} · ${d.maskedNumber}`,
      })),
      ...notes.map((n) => ({
        id: n.id,
        kind: 'NOTE' as const,
        title: n.body,
        meta: n.tag ?? undefined,
      })),
    ];
    if (!needle) return all.slice(0, 24);
    return all.filter((m) => {
      const hay = `${m.title} ${m.meta ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q, tasks, alarms, cards, docs, notes]);

  if (!open) return null;

  const goMatch = (m: Match) => {
    setOpen(false);
    if (m.kind === 'CARD' || m.kind === 'DOC') {
      router.push(`/detail/${m.id}`);
    } else if (m.kind === 'ALARM') {
      setTabByName('alarms');
    } else if (m.kind === 'TASK') {
      setTabByName('tasks');
    } else if (m.kind === 'NOTE') {
      setTabByName('tasks');
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.scrim} />
      </Pressable>

      <SafeAreaView style={styles.sheet} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.inputBar}>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={14}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <IconArrow dir="left" size={20} color={colors.bg} />
            </Pressable>
            <View style={styles.field}>
              <IconSearch size={18} color={colors.ink} />
              <TextInput
                ref={inputRef}
                value={q}
                onChangeText={setQ}
                placeholder="Search tasks, alarms, cards…"
                placeholderTextColor={colors.inkFaint}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.input}
              />
              {q.length > 0 ? (
                <Pressable onPress={() => setQ('')} hitSlop={10}>
                  <Text style={styles.clearText}>CLEAR</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Eyebrow>{q ? `RESULTS · ${results.length}` : 'RECENT'}</Eyebrow>
            <View style={{ gap: 8, marginTop: 10 }}>
              {results.length === 0 ? (
                <Text style={styles.empty}>
                  Nothing matches “{q}”.
                </Text>
              ) : (
                results.map((m) => (
                  <Pressable
                    key={`${m.kind}-${m.id}`}
                    onPress={() => goMatch(m)}
                    style={styles.row}
                  >
                    <View style={[styles.dot, { backgroundColor: KIND_COLOR[m.kind] }]} />
                    <View style={{ flex: 1 }}>
                      <Eyebrow>{m.kind}</Eyebrow>
                      <Text style={styles.rowTitle} numberOfLines={2}>{m.title}</Text>
                      {m.meta ? <Text style={styles.rowMeta} numberOfLines={1}>{m.meta}</Text> : null}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
            <View style={{ height: 200 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,11,0.88)',
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    paddingBottom: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgRaise2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
  },
  input: {
    flex: 1,
    ...type.body14,
    color: colors.ink,
    padding: 0,
  },
  clearText: {
    ...type.mono10,
    color: colors.inkDim,
    letterSpacing: 1.2,
  },
  list: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: 'rgba(20,20,22,0.8)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  rowTitle: { ...type.body14, color: colors.ink, marginTop: 4 },
  rowMeta: { ...type.mono11, color: colors.inkDim, letterSpacing: 0.6, marginTop: 2 },
  empty: { ...type.body14, color: colors.inkDim, paddingVertical: 20, textAlign: 'center' },
});
