import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, radii, spacing, type } from '../theme';
import { Eyebrow } from '../components/Eyebrow';
import { Chip } from '../components/Chip';
import { IconArrow, IconSparkle, IconSearch } from '../components/Icons';
import { askOmni, type SearchResult } from '../services/ai';
import { useStore } from '../store';

const TABS = ['ALL', 'TASKS', 'ALARMS', 'CARDS', 'DOCS'] as const;

function buildLocalResults(
  q: string,
  tasks: ReturnType<typeof useStore.getState>['tasks'],
  alarms: ReturnType<typeof useStore.getState>['alarms'],
  cards: ReturnType<typeof useStore.getState>['cards'],
  docs: ReturnType<typeof useStore.getState>['docs'],
  notes: ReturnType<typeof useStore.getState>['notes']
): SearchResult[] {
  const needle = q.trim().toLowerCase();
  const match = (s: string) => (needle ? s.toLowerCase().includes(needle) : true);
  const out: SearchResult[] = [];
  tasks.forEach((t) => {
    if (match(t.title) || match(t.tag)) {
      out.push({
        id: t.id,
        kind: 'TASK',
        title: t.title,
        meta: `${t.priority} · ${t.tag}${t.due ? ' · ' + t.due : ''}`,
      });
    }
  });
  alarms.forEach((a) => {
    if (match(a.label) || match(a.time)) {
      out.push({ id: a.id, kind: 'ALARM', title: a.label, meta: `${a.time} · ${a.recurring ? 'recurring' : 'one-time'}` });
    }
  });
  cards.forEach((c) => {
    if (match(c.issuer ?? '') || match(c.last4) || match(c.network ?? '')) {
      out.push({ id: c.id, kind: 'CARD', title: `${c.issuer ?? 'Card'} •••• ${c.last4}`, meta: c.network });
    }
  });
  docs.forEach((d) => {
    if (match(d.name) || match(d.docKind) || match(d.maskedNumber)) {
      out.push({ id: d.id, kind: 'DOC', title: d.docKind.toUpperCase(), meta: d.maskedNumber });
    }
  });
  notes.forEach((n) => {
    if (match(n.body)) {
      out.push({ id: n.id, kind: 'NOTE', title: n.body.slice(0, 80), meta: n.tag });
    }
  });
  return out.slice(0, 30);
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>('ALL');

  const tasks = useStore((s) => s.tasks);
  const alarms = useStore((s) => s.alarms);
  const cards = useStore((s) => s.cards);
  const docs = useStore((s) => s.docs);
  const notes = useStore((s) => s.notes);

  const onSubmit = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    const local = buildLocalResults(q, tasks, alarms, cards, docs, notes);
    setResults(local);
    try {
      const r = await askOmni(q, local);
      setAnswer(r.answer);
    } catch {
      setAnswer('(search unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    tab === 'ALL'
      ? results
      : results.filter((r) => {
          if (tab === 'TASKS') return r.kind === 'TASK';
          if (tab === 'ALARMS') return r.kind === 'ALARM';
          if (tab === 'CARDS') return r.kind === 'CARD';
          if (tab === 'DOCS') return r.kind === 'DOC' || r.kind === 'NOTE';
          return true;
        });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconArrow dir="left" size={16} color={colors.ink} />
          </Pressable>
          <View style={styles.inputWrap}>
            <IconSearch size={16} color={colors.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask Omni anything…"
              placeholderTextColor={colors.inkFaint}
              onSubmitEditing={onSubmit}
              returnKeyType="search"
              style={styles.input}
              autoFocus
              selectionColor={colors.ink}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {answer ? (
            <View style={styles.answerCard}>
              <View style={styles.answerHead}>
                <View style={styles.sparkle}>
                  <IconSparkle size={14} color={colors.bg} />
                </View>
                <Eyebrow>OMNI · GEMINI 2.5 FLASH</Eyebrow>
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </View>
          ) : !loading && !query ? (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyTitle}>What do you need?</Text>
              <Text style={styles.emptySub}>
                Search your tasks, alarms, cards, and notes. Ask a question and Omni finds + summarises.
              </Text>
            </View>
          ) : null}

          {loading ? <Eyebrow>THINKING…</Eyebrow> : null}

          {results.length ? (
            <View style={styles.tabRow}>
              {TABS.map((t) => {
                const count =
                  t === 'ALL'
                    ? results.length
                    : results.filter((r) => {
                        if (t === 'TASKS') return r.kind === 'TASK';
                        if (t === 'ALARMS') return r.kind === 'ALARM';
                        if (t === 'CARDS') return r.kind === 'CARD';
                        if (t === 'DOCS') return r.kind === 'DOC' || r.kind === 'NOTE';
                        return false;
                      }).length;
                return (
                  <Chip
                    key={t}
                    label={`${t} · ${count}`}
                    solid={tab === t}
                    active={tab === t}
                    onPress={() => setTab(t)}
                  />
                );
              })}
            </View>
          ) : null}

          <View style={{ gap: 8, marginTop: 12 }}>
            {filtered.map((r) => (
              <View key={r.id} style={styles.row}>
                <Eyebrow>{r.kind}</Eyebrow>
                <Text style={styles.rowTitle}>{r.title}</Text>
                {r.meta ? <Text style={styles.rowMeta}>{r.meta}</Text> : null}
              </View>
            ))}
            {!filtered.length && results.length ? (
              <Text style={styles.empty}>Nothing in this tab.</Text>
            ) : null}
            {!loading && query && !results.length ? (
              <Text style={styles.empty}>No matches for "{query}".</Text>
            ) : null}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.screenX,
    paddingTop: 4,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  input: {
    flex: 1,
    ...type.body14,
    color: colors.ink,
    padding: 0,
  },
  body: { paddingHorizontal: spacing.screenX, paddingTop: 12 },
  emptyHint: { paddingVertical: 20, gap: 10 },
  emptyTitle: { ...type.display28, color: colors.ink },
  emptySub: { ...type.body14, color: colors.inkDim, lineHeight: 22 },
  answerCard: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 10,
  },
  answerHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sparkle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: { ...type.body14, color: colors.ink, lineHeight: 22 },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 20,
  },
  row: {
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 4,
  },
  rowTitle: { ...type.body14, color: colors.ink },
  rowMeta: { ...type.mono10, color: colors.inkDim, letterSpacing: 0.8 },
  empty: { ...type.body13, color: colors.inkFaint, textAlign: 'center', padding: 20 },
});
