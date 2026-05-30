import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';

type Props = {
  data: { day: number; total: number }[];
  month: string; // "YYYY-MM"
};

export default function DailyChart({ data, month }: Props) {
  const [tooltip, setTooltip] = useState<{ day: number; total: number } | null>(null);

  const daysInMonth = new Date(
    Number(month.split('-')[0]),
    Number(month.split('-')[1]),
    0
  ).getDate();

  const map = Object.fromEntries(data.map(d => [d.day, d.total]));
  const max = Math.max(...data.map(d => d.total), 1);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === Number(month.split('-')[0]) &&
    today.getMonth() + 1 === Number(month.split('-')[1]);
  const todayDay = today.getDate();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Spending</Text>

      {tooltip && (
        <Text style={styles.tooltip}>
          Day {tooltip.day}: ₹{tooltip.total.toFixed(0)}
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const total = map[day] ?? 0;
          const heightPct = total > 0 ? Math.max((total / max) * 100, 8) : 0;
          const isToday = isCurrentMonth && day === todayDay;
          const isActive = tooltip?.day === day;

          return (
            <Pressable
              key={day}
              style={styles.barCol}
              onPress={() => setTooltip(isActive ? null : total > 0 ? { day, total } : null)}
            >
              <View style={styles.barArea}>
                {total > 0 && (
                  <View
                    style={[
                      styles.bar,
                      { height: `${heightPct}%` as any },
                      isActive && styles.barActive,
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 8 },
  tooltip: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 4,
    gap: 4,
  },
  barCol: {
    alignItems: 'center',
    width: 20,
  },
  barArea: {
    height: 80,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
    opacity: 0.8,
  },
  barActive: {
    opacity: 1,
    backgroundColor: '#4f46e5',
  },
  dayLabel: { fontSize: 9, color: '#94a3b8', marginTop: 3 },
  todayLabel: { color: '#6366f1', fontWeight: '700' },
});
