import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { colors, CARD_ASPECT, radii, spacing, type } from '../../theme';
import { Eyebrow } from '../../components/Eyebrow';
import { IconArrow } from '../../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store';

const KEYS: Array<string | null> = [
  '1','2','3',
  '4','5','6',
  '7','8','9',
  null,'0','⌫',
];

export default function ManualEntry() {
  const router = useRouter();
  const [digits, setDigits] = useState<string>('');
  const W = Dimensions.get('window').width - spacing.screenX * 2;
  const H = W / CARD_ASPECT;
  const addCard = useStore((s) => s.addCard);

  const onKey = (k: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (k === '⌫') setDigits((d) => d.slice(0, -1));
    else if (digits.length < 4) setDigits((d) => d + k);
  };

  const confirmed = digits.length === 4;

  const onSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addCard({
      id: `c_${Date.now()}`,
      kind: 'pay',
      brand: 'visa',
      cardType: 'credit',
      last4: digits,
      holder: 'AAKASH NARUKULA',
      expiry: '08/29',
      network: 'Visa',
      issuer: 'Manual entry',
      confidence: 1,
    });
    useStore.getState().setTabByName('cards');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>MANUAL · LAST 4 ONLY</Eyebrow>
      </View>

      <View style={styles.body}>
        <View
          style={{
            width: W,
            height: H,
            borderRadius: 18,
            overflow: 'hidden',
            alignSelf: 'center',
          }}
        >
          <LinearGradient
            colors={['#1a1a22', '#0a0a0b']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.prev}>
            <Eyebrow>NEW CARD · AWAITING LAST 4</Eyebrow>
            <Text style={[type.mono15, { color: colors.ink }]}>
              4532 •••• •••• {digits.padEnd(4, '·').split('').join(' ')}
            </Text>
            <Text style={[type.body12, { color: colors.inkDim }]}>AAKASH NARUKULA · 08/29</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />

        <Eyebrow style={{ textAlign: 'center' }}>ENTER LAST 4 DIGITS</Eyebrow>
        <View style={styles.boxesRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.box,
                i === digits.length && styles.boxActive,
              ]}
            >
              <Text style={styles.boxChar}>{digits[i] ?? ''}</Text>
              {i === digits.length ? <View style={styles.cursor} /> : null}
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.keypad}>
          {KEYS.map((k, i) =>
            k === null ? (
              <View key={`s-${i}`} style={styles.key} />
            ) : (
              <Pressable
                key={k + i}
                onPress={() => onKey(k)}
                style={({ pressed }) => [
                  styles.key,
                  pressed && { opacity: 0.55 },
                ]}
              >
                <Text style={styles.keyText}>{k}</Text>
              </Pressable>
            )
          )}
        </View>

        <Pressable
          onPress={confirmed ? onSave : undefined}
          style={[styles.primary, !confirmed && { backgroundColor: colors.inkGhost }]}
        >
          <Text style={[styles.primaryText, !confirmed && { color: colors.inkFaint }]}>
            SAVE CARD
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
    paddingBottom: 8,
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
  body: { flex: 1, paddingHorizontal: spacing.screenX, paddingBottom: 32, gap: 6 },
  prev: { flex: 1, padding: 18, justifyContent: 'flex-end', gap: 6 },
  boxesRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10 },
  box: {
    width: 56,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.ink },
  boxChar: { ...type.mono15, color: colors.ink, fontSize: 22 },
  cursor: {
    position: 'absolute',
    bottom: 14,
    width: 18,
    height: 2,
    backgroundColor: colors.ink,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  key: {
    width: '31%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  keyText: { ...type.mono15, color: colors.ink, fontSize: 22 },
  primary: {
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    backgroundColor: colors.ink,
  },
  primaryText: { ...type.mono11, color: colors.bg, letterSpacing: 1.4 },
});
