import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { CategorySummary } from '../db/queries';
import { C, FONT } from '../constants/theme';

type Props = { item: CategorySummary; onPress: () => void };

export default function CategoryCard({ item, onPress }: Props) {
  const hasLimit = item.limit_amount !== null && item.limit_amount > 0;
  const ratio = hasLimit ? item.spent / item.limit_amount! : 0;

  const barColor = ratio >= 1 ? C.danger : ratio >= 0.8 ? C.amber : C.accent;
  const barWidth = hasLimit ? `${Math.min(ratio * 100, 100)}%` : '0%';
  const status = ratio >= 1 ? 'over' : ratio >= 0.8 ? 'near' : 'ok';

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={[styles.badge, { color: barColor, borderColor: barColor }]}>{status}</Text>
      </View>

      {hasLimit ? (
        <>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: barWidth as any, backgroundColor: barColor }]} />
          </View>
          <View style={styles.row}>
            <Text style={styles.sub}>
              <Text style={styles.mono}>₹{item.spent.toFixed(0)}</Text>
              <Text style={styles.dimSlash}> / </Text>
              <Text style={[styles.mono, { color: C.textMuted }]}>₹{item.limit_amount!.toFixed(0)}</Text>
            </Text>
            {item.remaining >= 0
              ? <Text style={[styles.mono, { color: C.textMuted, fontSize: 12 }]}>₹{item.remaining.toFixed(0)} left</Text>
              : <Text style={[styles.mono, { color: C.danger, fontSize: 12 }]}>+₹{Math.abs(item.remaining).toFixed(0)} over</Text>
            }
          </View>
        </>
      ) : (
        <Text style={styles.noLimit}>no budget set</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: C.text, fontFamily: FONT.mono, textTransform: 'lowercase' },
  badge: {
    fontSize: 10,
    fontFamily: FONT.mono,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barBg: {
    height: 2,
    backgroundColor: C.surface2,
    borderRadius: 2,
    marginVertical: 12,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  sub: { fontSize: 13 },
  mono: { fontFamily: FONT.mono, color: C.text, fontSize: 13 },
  dimSlash: { color: C.textMuted },
  noLimit: { fontSize: 12, color: C.textMuted, marginTop: 8, fontFamily: FONT.mono },
});
