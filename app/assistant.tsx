import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radii, spacing, type } from '../theme';
import { Eyebrow } from '../components/Eyebrow';
import { IconArrow, IconSparkle } from '../components/Icons';
import { answerQuestion, type AssistantResult, type Match } from '../services/assistant';
import { speak } from '../services/tts';
import { useStore } from '../store';

const KIND_COLOR: Record<Match['kind'], string> = {
  TASK: colors.ink,
  ALARM: colors.ok,
  CARD: colors.ink,
  DOC: colors.ink,
  NOTE: colors.inkDim,
};

export default function AssistantScreen() {
  const router = useRouter();
  const { q = '' } = useLocalSearchParams<{ q?: string }>();
  const question = String(q);

  const [state, setState] = useState<'thinking' | 'done' | 'error'>('thinking');
  const [result, setResult] = useState<AssistantResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!question) {
        setState('done');
        return;
      }
      try {
        const r = await answerQuestion(question);
        if (cancelled) return;
        setResult(r);
        setState('done');
        speak(r.answer);
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [question]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>OMNI ASSISTANT</Eyebrow>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Eyebrow>YOU ASKED</Eyebrow>
        <Text style={styles.q}>{question || '…'}</Text>

        <View style={{ height: 14 }} />

        <View style={styles.answerCard}>
          <View style={styles.sparkleRow}>
            <View style={styles.sparkleDot}>
              <IconSparkle size={14} color={colors.bg} />
            </View>
            <Eyebrow>
              {state === 'thinking'
                ? 'THINKING…'
                : result?.usedProxy
                ? 'ANSWER · CLOUD'
                : 'ANSWER · ON-DEVICE'}
            </Eyebrow>
          </View>
          <Text style={styles.answer}>
            {state === 'thinking'
              ? 'Searching your Omni data…'
              : state === 'error'
              ? "Something went wrong."
              : result?.answer ?? '—'}
          </Text>
        </View>

        {result && result.matches.length > 0 ? (
          <>
            <View style={{ height: 18 }} />
            <Eyebrow>MATCHES · {result.matches.length}</Eyebrow>
            <View style={{ gap: 8, marginTop: 10 }}>
              {result.matches.map((m) => (
                <Pressable
                  key={`${m.kind}-${m.id}`}
                  onPress={() => {
                    if (m.kind === 'CARD' || m.kind === 'DOC') {
                      router.push(`/detail/${m.id}`);
                    } else if (m.kind === 'ALARM') {
                      useStore.getState().setTabByName('alarms');
                      router.back();
                    } else if (m.kind === 'TASK') {
                      useStore.getState().setTabByName('tasks');
                      router.back();
                    }
                  }}
                  style={styles.row}
                >
                  <View style={[styles.dot, { backgroundColor: KIND_COLOR[m.kind] }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Eyebrow>{m.kind}</Eyebrow>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>{m.title}</Text>
                    {m.meta ? (
                      <Text style={styles.meta} numberOfLines={1}>{m.meta}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <View style={{ height: 160 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  body: { paddingHorizontal: spacing.screenX },
  q: {
    ...type.display28,
    color: colors.ink,
    marginTop: 6,
    lineHeight: 32,
  },
  answerCard: {
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    gap: 10,
  },
  sparkleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sparkleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answer: {
    ...type.body14,
    color: colors.ink,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { ...type.body14, color: colors.ink, marginTop: 4 },
  meta: { ...type.mono11, color: colors.inkDim, letterSpacing: 0.6, marginTop: 2 },
});
