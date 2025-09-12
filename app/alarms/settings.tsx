import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { colors, radii, spacing, type } from '../../theme';
import { Eyebrow } from '../../components/Eyebrow';
import { IconArrow } from '../../components/Icons';
import { useStore } from '../../store';

const DAYS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'] as const;

export default function AlarmsSettings() {
  const router = useRouter();
  const alarms = useStore((s) => s.alarms);
  const reminders = useStore((s) => s.reminders);
  const toggleAlarm = useStore((s) => s.toggleAlarm);

  const firstEnabled = alarms.find((a) => a.enabled);
  const countdownLabel = firstEnabled ? `Next · ${firstEnabled.label} · ${firstEnabled.time}` : 'No alarms armed';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconArrow dir="left" size={16} color={colors.ink} />
        </Pressable>
        <Eyebrow>CONFIGURE</Eyebrow>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Alarms</Text>
        <Text style={styles.count}>{countdownLabel}</Text>

        <View style={{ height: 22 }} />

        <Eyebrow>RECURRING</Eyebrow>
        <View style={{ gap: 10, marginTop: 10 }}>
          {alarms.map((a) => (
            <View key={a.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[type.mono15, { color: colors.ink, letterSpacing: 1 }]}>{a.time}</Text>
                <Text style={[type.body13, { color: colors.inkDim, marginTop: 2 }]}>{a.label}</Text>
                <View style={styles.dayRow}>
                  {DAYS.map((d) => {
                    const active = a.days.includes(d);
                    return (
                      <View
                        key={d}
                        style={[
                          styles.dayChip,
                          active && { backgroundColor: colors.ink, borderColor: colors.ink },
                        ]}
                      >
                        <Text style={[type.mono10, { color: active ? colors.bg : colors.inkDim, letterSpacing: 0.5 }]}>
                          {d}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Switch
                value={a.enabled}
                onValueChange={() => {
                  toggleAlarm(a.id);
                  Haptics.selectionAsync().catch(() => {});
                }}
                trackColor={{ false: colors.bgRaise2, true: colors.ink }}
                thumbColor={colors.bg}
              />
            </View>
          ))}
        </View>

        <View style={{ height: 18 }} />
        <Eyebrow>ONE-TIME REMINDERS</Eyebrow>
        <View style={{ gap: 10, marginTop: 10 }}>
          {reminders.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[type.mono15, { color: colors.ink, letterSpacing: 1 }]}>{r.at}</Text>
                <Text style={[type.body13, { color: colors.inkDim, marginTop: 2 }]}>{r.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
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
  body: { paddingHorizontal: spacing.screenX, paddingTop: 6, paddingBottom: 60 },
  title: { ...type.display32, color: colors.ink, marginTop: 4 },
  count: { ...type.body14, color: colors.inkDim, marginTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.bgRaise,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  dayRow: { flexDirection: 'row', gap: 5, marginTop: 10 },
  dayChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.bgRaise2,
  },
});
