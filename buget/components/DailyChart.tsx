import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { C, FONT } from '../constants/theme';

type Props = {
  data: { day: number; total: number }[];
  month: string;
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
      <View style={styles.header}>
        <Text style={styles.title}>// daily_spend</Text>
        {tooltip
          ? <Text style={styles.tooltip}>day {tooltip.day} → ₹{tooltip.total.toFixed(0)}</Text>
          : <Text style={styles.hint}>tap a bar</Text>
        }
      </View>

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
                  <View style={[
                    styles.bar,
                    { height: `${heightPct}%` as any },
                    isActive && styles.barActive,
                  ]} />
                )}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface, borderRadius: 8,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: FONT.mono, fontSize: 11, color: C.textMuted },
  tooltip: { fontFamily: FONT.mono, fontSize: 12, color: C.accent },
  hint: { fontFamily: FONT.mono, fontSize: 11, color: C.border2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingVertical: 4 },
  barCol: { alignItems: 'center', width: 18 },
  barArea: { height: 72, justifyContent: 'flex-end', width: '100%' },
  bar: { width: '100%', backgroundColor: C.accent, borderRadius: 2, opacity: 0.7 },
  barActive: { opacity: 1 },
  dayLabel: { fontFamily: FONT.mono, fontSize: 8, color: C.textMuted, marginTop: 4 },
  todayLabel: { color: C.accent },
});
