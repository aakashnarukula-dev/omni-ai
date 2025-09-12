import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, spacing, type, radii } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { useStore } from '../../store';
import type { Alarm } from '../../store/types';

const DAY_ORDER: Record<string, number> = { Su: 0, M: 1, T: 2, W: 3, Th: 4, F: 5, Sa: 6 };
const DAY_SHORT: Record<string, string> = { Su: 'S', M: 'M', T: 'T', W: 'W', Th: 'T', F: 'F', Sa: 'S' };

function formatDays(days: string[]): string {
  if (!days.length) return 'ONE TIME';
  if (days.length === 7) return 'EVERY DAY';
  const weekdays = ['M', 'T', 'W', 'Th', 'F'];
  const sorted = [...days].sort((a, b) => (DAY_ORDER[a] ?? 0) - (DAY_ORDER[b] ?? 0));
  const isWeekdays =
    sorted.length === 5 && sorted.every((d, i) => d === weekdays[i]);
  if (isWeekdays) return 'WEEKDAYS';
  return sorted.map((d) => DAY_SHORT[d] ?? '').join(' ');
}

export default function AlarmsTimeline() {
  const router = useRouter();
  const alarms = useStore((s) => s.alarms);
  const toggleAlarm = useStore((s) => s.toggleAlarm);
  const dismissAlarm = useStore((s) => s.dismissAlarm);

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      {alarms.length ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {alarms.map((a) => (
              <AlarmRow
                key={a.id}
                alarm={a}
                onToggle={() => toggleAlarm(a.id)}
                onOpen={() => router.push({ pathname: '/alarms/ringing', params: { id: a.id } })}
                onComplete={() => dismissAlarm(a.id)}
              />
            ))}
          </View>
          <View style={{ height: 160 }} />
        </ScrollView>
      ) : (
        <EmptyState
          title="Nothing here yet."
          subtitle="Tap the mic and tell Omni what to remember."
        />
      )}
    </SafeAreaView>
  );
}

function AlarmRow({
  alarm,
  onToggle,
  onOpen,
  onComplete,
}: {
  alarm: Alarm;
  onToggle: () => void;
  onOpen: () => void;
  onComplete: () => void;
}) {
  const dim = !alarm.enabled;
  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.left}>
        <Text style={[styles.time, dim && { color: colors.inkFaint }]}>{alarm.time}</Text>
        <Text style={[styles.days, dim && { color: colors.inkFaint }]}>{formatDays(alarm.days)}</Text>
      </View>
      <Text
        style={[styles.label, dim && { color: colors.inkFaint }]}
        numberOfLines={1}
      >
        {alarm.label}
      </Text>
      {alarm.enabled && (
        <Pressable onPress={onComplete} hitSlop={8} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>DONE</Text>
        </Pressable>
      )}
      <Switch
        value={alarm.enabled}
        onValueChange={onToggle}
        trackColor={{ false: '#2a2a2e', true: colors.ink }}
        thumbColor={alarm.enabled ? colors.bg : '#7a7a80'}
        ios_backgroundColor="#2a2a2e"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.screenX, paddingTop: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  left: { gap: 4, minWidth: 84 },
  time: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 1.5,
  },
  days: {
    ...type.mono10,
    color: colors.inkDim,
    letterSpacing: 2,
  },
  label: {
    ...type.body14,
    color: colors.ink,
    flex: 1,
  },
  doneBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.ink,
  },
  doneBtnText: {
    ...type.mono10,
    color: colors.bg,
    letterSpacing: 1.2,
  },
});
