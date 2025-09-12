import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, type } from '../theme';
import { Eyebrow } from '../components/Eyebrow';
import { IconArrow } from '../components/Icons';
import { executeCommand, parseCommand, type ParsedCommand } from '../services/command';
import { speak } from '../services/tts';
import type { Match } from '../services/assistant';

const KIND_COLOR: Record<Match['kind'], string> = {
  TASK: colors.ink,
  ALARM: colors.ok,
  CARD: colors.ink,
  DOC: colors.ink,
  NOTE: colors.inkDim,
};

export default function ConfirmScreen() {
  const router = useRouter();
  const { q = '' } = useLocalSearchParams<{ q?: string }>();
  const transcript = String(q);

  const cmd = useMemo<ParsedCommand | null>(() => parseCommand(transcript), [transcript]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!cmd) return;
    if (cmd.matches.length === 0) {
      speak('Nothing matching found.');
    } else {
      speak(`Delete ${cmd.summary}?`);
    }
  }, [cmd]);

  const onConfirm = async () => {
    if (!cmd || cmd.matches.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await executeCommand(cmd);
    setDone(true);
    speak(`Deleted ${cmd.matches.length} ${cmd.matches.length === 1 ? 'item' : 'items'}.`);
    setTimeout(() => router.back(), 650);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>CONFIRM DELETE</Eyebrow>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Eyebrow>YOU SAID</Eyebrow>
        <Text style={styles.q}>{transcript || '…'}</Text>

        <View style={{ height: 14 }} />

        <View style={styles.summary}>
          <Eyebrow style={{ color: colors.urgent }}>
            {done ? 'DELETED' : cmd?.matches.length ? 'ABOUT TO DELETE' : 'NOTHING TO DELETE'}
          </Eyebrow>
          <Text style={styles.summaryText}>
            {cmd ? cmd.summary : 'Could not parse command.'}
          </Text>
        </View>

        {cmd && cmd.matches.length > 0 ? (
          <View style={{ marginTop: 18, gap: 8 }}>
            <Eyebrow>ITEMS</Eyebrow>
            {cmd.matches.map((m) => (
              <View key={`${m.kind}-${m.id}`} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: KIND_COLOR[m.kind] }]} />
                <View style={{ flex: 1 }}>
                  <Eyebrow>{m.kind}</Eyebrow>
                  <Text style={styles.title} numberOfLines={2}>{m.title}</Text>
                  {m.meta ? <Text style={styles.meta}>{m.meta}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.ghostBtn} onPress={() => router.back()}>
          <Text style={styles.ghostBtnText}>CANCEL</Text>
        </Pressable>
        <Pressable
          style={[
            styles.primary,
            (!cmd || cmd.matches.length === 0 || done) && { backgroundColor: colors.inkGhost },
          ]}
          onPress={onConfirm}
          disabled={!cmd || cmd.matches.length === 0 || done}
        >
          <Text
            style={[
              styles.primaryText,
              (!cmd || cmd.matches.length === 0 || done) && { color: colors.inkFaint },
            ]}
          >
            {done ? 'DONE' : 'DELETE'}
          </Text>
        </Pressable>
      </View>
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
  summary: {
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.urgent,
    gap: 6,
  },
  summaryText: { ...type.body14, color: colors.ink },
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
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.screenX,
    paddingBottom: 32,
  },
  ghostBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  ghostBtnText: { ...type.mono11, color: colors.ink, letterSpacing: 1.2 },
  primary: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.urgent,
  },
  primaryText: { ...type.mono11, color: colors.bg, letterSpacing: 1.2 },
});
