import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getExpensesByMonth, deleteExpense, type Expense } from '../db/queries';
import { currentMonth } from '../constants/insults';
import { C, FONT } from '../constants/theme';

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function HistoryScreen() {
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<(Expense & { category_name: string })[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    getExpensesByMonth(month).then(setExpenses);
  }, [month]));

  const confirmDelete = async (id: number) => {
    await deleteExpense(id);
    setConfirmDeleteId(null);
    getExpensesByMonth(month).then(setExpenses);
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const canGoNext = month < currentMonth();

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Pressable onPress={() => setMonth(prevMonth(month))}>
          <Text style={styles.navArrow}>←</Text>
        </Pressable>
        <Text style={styles.monthLabel}>// {month}</Text>
        <Pressable onPress={() => canGoNext && setMonth(nextMonth(month))} disabled={!canGoNext}>
          <Text style={[styles.navArrow, !canGoNext && { color: C.surface2 }]}>→</Text>
        </Pressable>
      </View>

      {expenses.length > 0 && (
        <Text style={styles.total}>total → ₹{total.toFixed(0)}</Text>
      )}

      <FlatList
        data={expenses}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => {
          if (confirmDeleteId === item.id) {
            return (
              <View style={[styles.row, styles.confirmRow]}>
                <Text style={styles.confirmText}>delete this?</Text>
                <View style={styles.actions}>
                  <Pressable style={styles.dangerBtn} onPress={() => confirmDelete(item.id)}>
                    <Text style={styles.dangerText}>yes</Text>
                  </Pressable>
                  <Pressable style={styles.ghostBtn} onPress={() => setConfirmDeleteId(null)}>
                    <Text style={styles.ghostText}>no</Text>
                  </Pressable>
                </View>
              </View>
            );
          }
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.catName}>{item.category_name}</Text>
                  <Text style={styles.amount}>₹{item.amount.toFixed(0)}</Text>
                </View>
                {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Pressable onPress={() => setConfirmDeleteId(item.id)} style={{ paddingLeft: 12 }}>
                <Text style={styles.deleteBtn}>✕</Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.hint}>no expenses for {month}</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navArrow: { fontFamily: FONT.mono, fontSize: 18, color: C.accent, padding: 4 },
  monthLabel: { fontFamily: FONT.mono, fontSize: 13, color: C.text },
  total: { fontFamily: FONT.mono, fontSize: 12, color: C.textMuted, marginBottom: 14 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 8, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  confirmRow: { borderColor: C.danger },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontFamily: FONT.mono, fontSize: 13, color: C.text },
  amount: { fontFamily: FONT.mono, fontSize: 13, color: C.accent },
  note: { fontFamily: FONT.mono, fontSize: 12, color: C.textMuted, marginTop: 3 },
  date: { fontFamily: FONT.mono, fontSize: 10, color: C.textMuted, marginTop: 4 },
  deleteBtn: { fontFamily: FONT.mono, color: C.danger, fontSize: 14 },
  confirmText: { fontFamily: FONT.mono, fontSize: 13, color: C.text, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  dangerBtn: { borderWidth: 1, borderColor: C.danger, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  dangerText: { fontFamily: FONT.mono, color: C.danger, fontSize: 12 },
  ghostBtn: { borderWidth: 1, borderColor: C.border2, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  ghostText: { fontFamily: FONT.mono, color: C.textMuted, fontSize: 12 },
  hint: { fontFamily: FONT.mono, fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 40 },
});
