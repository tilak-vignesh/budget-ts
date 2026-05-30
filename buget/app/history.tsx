import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getExpensesByMonth, deleteExpense, type Expense } from '../db/queries';
import { currentMonth } from '../constants/insults';

function prevMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function nextMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function HistoryScreen() {
  const [month, setMonth] = useState(currentMonth());
  const [expenses, setExpenses] = useState<(Expense & { category_name: string })[]>([]);

  const load = useCallback(async () => {
    setExpenses(await getExpensesByMonth(month));
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id: number) => {
    Alert.alert('Delete expense?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(id); load(); } },
    ]);
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const canGoNext = month < currentMonth();

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Pressable style={styles.navBtn} onPress={() => setMonth(prevMonth(month))}>
          <Text style={styles.navArrow}>{'<'}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{month}</Text>
        <Pressable style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]} onPress={() => canGoNext && setMonth(nextMonth(month))}>
          <Text style={[styles.navArrow, !canGoNext && { color: '#cbd5e1' }]}>{'>'}</Text>
        </Pressable>
      </View>

      {expenses.length > 0 && (
        <Text style={styles.total}>Total spent: ₹{total.toFixed(0)}</Text>
      )}

      <FlatList
        data={expenses}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={styles.catName}>{item.category_name}</Text>
                <Text style={styles.amount}>₹{item.amount.toFixed(0)}</Text>
              </View>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Pressable onPress={() => remove(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.hint}>No expenses for {month}.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 8 },
  navBtnDisabled: { opacity: 0.4 },
  navArrow: { fontSize: 20, color: '#6366f1', fontWeight: '700' },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  total: { fontSize: 14, color: '#64748b', marginBottom: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize', color: '#1e293b' },
  amount: { fontSize: 14, fontWeight: '700', color: '#6366f1' },
  note: { fontSize: 13, color: '#64748b', marginTop: 2 },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  deleteBtn: { paddingLeft: 12 },
  deleteText: { color: '#ef4444', fontSize: 16 },
  hint: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
