import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { CategorySummary } from '../db/queries';

type Props = { item: CategorySummary; onPress: () => void };

export default function CategoryCard({ item, onPress }: Props) {
  const hasLimit = item.limit_amount !== null && item.limit_amount > 0;
  const ratio = hasLimit ? item.spent / item.limit_amount! : 0;

  const barColor = ratio >= 1 ? '#ef4444' : ratio >= 0.8 ? '#f59e0b' : '#22c55e';
  const barWidth = hasLimit ? `${Math.min(ratio * 100, 100)}%` : '0%';

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={[styles.badge, { backgroundColor: barColor }]}>
          {ratio >= 1 ? 'OVER' : ratio >= 0.8 ? 'NEAR' : 'OK'}
        </Text>
      </View>

      {hasLimit ? (
        <>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: barWidth as any, backgroundColor: barColor }]} />
          </View>
          <View style={styles.row}>
            <Text style={styles.sub}>Spent: ₹{item.spent.toFixed(0)}</Text>
            <Text style={styles.sub}>Limit: ₹{item.limit_amount!.toFixed(0)}</Text>
          </View>
          {item.remaining < 0 && (
            <Text style={styles.over}>Over by ₹{Math.abs(item.remaining).toFixed(0)}</Text>
          )}
        </>
      ) : (
        <Text style={styles.noLimit}>No budget set for this month</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  barBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4 },
  sub: { fontSize: 13, color: '#64748b' },
  over: { fontSize: 13, color: '#ef4444', marginTop: 4, fontWeight: '600' },
  noLimit: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
});
