import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, type } from '../theme';
import { Eyebrow } from '../components/Eyebrow';
import { Chip } from '../components/Chip';
import { IconArrow, IconSparkle } from '../components/Icons';
import { useStore } from '../store';
import type { ClassifiedItem } from '../store/types';

const KIND_META: Record<ClassifiedItem['kind'], { label: string; color: string }> = {
  TASK: { label: 'TASK DETECTED', color: colors.ink },
  ALARM: { label: 'ALARM SET', color: colors.ok },
  NOTE: { label: 'NOTE', color: colors.inkDim },
  CARD: { label: 'CARD MENTIONED', color: colors.inkDim },
};

export default function TranscribeScreen() {
  const router = useRouter();
  const voice = useStore((s) => s.voice);
  const acceptClassification = useStore((s) => s.acceptClassification);
  const dismissClassification = useStore((s) => s.dismissClassification);
  const commitClassifications = useStore((s) => s.commitClassifications);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const onCommit = async () => {
    await commitClassifications();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>CLASSIFYING · GEMINI 2.5 FLASH</Eyebrow>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>YOU SAID</Eyebrow>
        <Text style={styles.transcript}>{voice.transcript}</Text>

        <View style={styles.sparkleRow}>
          <IconSparkle size={16} color={colors.inkDim} />
          <Eyebrow>
            {voice.state === 'classifying'
              ? 'SORTING…'
              : `OMNI SORTED THIS INTO ${voice.classifications.length} ITEMS`}
          </Eyebrow>
        </View>

        <View style={{ gap: 10 }}>
          {voice.classifications.map((c, i) => (
            <Animated.View
              key={c.id}
              entering={FadeInDown.delay(i * 220).springify()}
              layout={Layout.springify()}
              style={[
                styles.card,
                c.confidence < 0.85 && {
                  borderLeftColor: colors.urgent,
                  borderLeftWidth: 2,
                  paddingLeft: 12,
                },
              ]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.dot, { backgroundColor: KIND_META[c.kind].color }]} />
                <Eyebrow>{KIND_META[c.kind].label}</Eyebrow>
                <View style={{ flex: 1 }} />
                <Eyebrow style={{ color: colors.inkDim }}>
                  {Math.round(c.confidence * 100)}%
                </Eyebrow>
              </View>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <View style={styles.cardMeta}>
                {c.priority ? <Chip label={c.priority} solid={c.priority === 'P1'} urgent={c.priority === 'P1'} /> : null}
                {c.tag ? <Chip label={c.tag} /> : null}
                {c.due ? <Chip label={c.due} /> : null}
              </View>
              {c.confidence < 0.85 ? (
                <View style={styles.confirmRow}>
                  <Pressable
                    onPress={() => {
                      acceptClassification(c.id);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    style={[styles.confirmBtn, { backgroundColor: colors.ink }]}
                  >
                    <Text style={[styles.confirmText, { color: colors.bg }]}>
                      {c.accepted ? 'ACCEPTED' : 'ACCEPT'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => dismissClassification(c.id)}
                    style={styles.confirmBtn}
                  >
                    <Text style={styles.confirmText}>DISMISS</Text>
                  </Pressable>
                </View>
              ) : null}
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.ghostBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.ghostBtnText}>RE-RECORD</Text>
        </Pressable>
        <Pressable
          disabled={!voice.classifications.length}
          style={[styles.primary, !voice.classifications.length && { backgroundColor: colors.inkGhost }]}
          onPress={onCommit}
        >
          <Text style={[styles.primaryText, !voice.classifications.length && { color: colors.inkFaint }]}>
            COMMIT ALL
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
  body: { paddingHorizontal: spacing.screenX, paddingBottom: 60, gap: 14 },
  transcript: {
    ...type.display28,
    color: colors.ink,
    lineHeight: 32,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  card: {
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { ...type.body14, color: colors.ink, lineHeight: 20 },
  cardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  confirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bgRaise2,
  },
  confirmText: { ...type.mono10, color: colors.ink, letterSpacing: 0.8 },
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
    backgroundColor: colors.ink,
  },
  primaryText: { ...type.mono11, color: colors.bg, letterSpacing: 1.2 },
});
