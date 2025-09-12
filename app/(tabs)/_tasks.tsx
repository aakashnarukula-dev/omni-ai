import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, type } from '../../theme';
import { Checkbox } from '../../components/Checkbox';
import { EmptyState } from '../../components/EmptyState';
import { useStore } from '../../store';
import type { Priority, Task } from '../../store/types';

const PRIORITY_RANK: Record<Priority, number> = { P1: 0, P2: 1, P3: 2 };

const PRIORITY_PILL: Record<Priority, { bg: string; fg: string }> = {
  P1: { bg: colors.urgent, fg: colors.bg },
  P2: { bg: colors.ink, fg: colors.bg },
  P3: { bg: colors.inkGhost, fg: colors.ink },
};

export default function TasksScreen() {
  const tasks = useStore((s) => s.tasks);
  const toggleTask = useStore((s) => s.toggleTask);

  const ordered = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return (a.due ?? '').localeCompare(b.due ?? '');
    });
  }, [tasks]);

  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <FlatList
        data={ordered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={ordered.length ? styles.body : styles.bodyEmpty}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <EmptyState
            title="Nothing here yet."
            subtitle="Tap the mic and tell Omni what to remember."
          />
        }
        renderItem={({ item }) => <Row task={item} onToggle={() => toggleTask(item.id)} />}
      />
    </SafeAreaView>
  );
}

function Row({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const pill = PRIORITY_PILL[task.priority];
  const dim = task.done;
  return (
    <View style={styles.row}>
      <Checkbox checked={task.done} onToggle={onToggle} />
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={3}
          style={[
            styles.title,
            dim && { color: colors.inkFaint, textDecorationLine: 'line-through' },
          ]}
        >
          {task.title}
        </Text>
        {task.due ? (
          <Text style={styles.due}>{task.due.toUpperCase()}</Text>
        ) : null}
      </View>
      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
        <Text style={[styles.pillText, { color: pill.fg }]}>{task.priority}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 6,
    paddingBottom: 160,
  },
  bodyEmpty: { flexGrow: 1, paddingBottom: 160 },
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
  title: { ...type.body14, color: colors.ink, lineHeight: 20 },
  due: {
    ...type.mono10,
    color: colors.inkDim,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    minWidth: 34,
    alignItems: 'center',
  },
  pillText: {
    ...type.mono10,
    letterSpacing: 1.2,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
