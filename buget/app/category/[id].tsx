import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useFocusEffect } from 'expo-router';
import {
  getMonthlySummary, getExpensesByMonth, addExpense, updateExpense,
  deleteExpense, getBudget, getSpentForCategory, getDailySpend, type Expense,
} from '../../db/queries';
import { currentMonth, randomInsult } from '../../constants/insults';
import InsultModal from '../../components/InsultModal';
import DailyChart from '../../components/DailyChart';

type ExpenseWithCat = Expense & { category_name: string };
type EditState = { id: number; amount: string; note: string } | null;

const sanitize = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const catId = Number(id);
  const navigation = useNavigation();
  const month = currentMonth();

  const [catName, setCatName] = useState('');
  const [spent, setSpent] = useState(0);
  const [limit, setLimit] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseWithCat[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<EditState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [insult, setInsult] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<{ day: number; total: number }[]>([]);

  const load = useCallback(async () => {
    const [summary, allExpenses, budget, daily] = await Promise.all([
      getMonthlySummary(month),
      getExpensesByMonth(month),
      getBudget(catId, month),
      getDailySpend(catId, month),
    ]);
    setDailyData(daily);
    const cat = summary.find(s => s.id === catId);
    if (cat) {
      setCatName(cat.name);
      setSpent(cat.spent);
      navigation.setOptions({ title: cat.name.charAt(0).toUpperCase() + cat.name.slice(1) });
    }
    setLimit(budget?.limit_amount ?? 0);
    setExpenses(allExpenses.filter(e => e.category_id === catId));
  }, [catId, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitAdd = async () => {
    const num = parseFloat(amount);
    if (!(num > 0)) return Alert.alert('Enter a valid amount');
    await addExpense(catId, month, num, note);
    const newSpent = await getSpentForCategory(catId, month);
    setAmount('');
    setNote('');
    await load();
    if (limit > 0 && newSpent > limit) setInsult(randomInsult());
    else if (limit > 0 && newSpent >= limit) Alert.alert('Limit reached', "You've hit your limit for this category.");
  };

  const submitEdit = async () => {
    if (!editing) return;
    const num = parseFloat(editing.amount);
    if (!(num > 0)) return Alert.alert('Enter a valid amount');
    await updateExpense(editing.id, num, editing.note);
    setEditing(null);
    load();
  };

  const confirmDelete = async (expId: number) => {
    await deleteExpense(expId);
    setConfirmDeleteId(null);
    load();
  };

  const ratio = limit > 0 ? spent / limit : 0;
  const barColor = ratio >= 1 ? '#ef4444' : ratio >= 0.8 ? '#f59e0b' : '#22c55e';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Summary bar */}
        <View style={styles.summaryCard}>
          {limit > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Spent</Text>
                <Text style={styles.summaryLabel}>Limit</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryAmount, { color: barColor }]}>₹{spent.toFixed(0)}</Text>
                <Text style={styles.summaryAmount}>₹{limit.toFixed(0)}</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.min(ratio * 100, 100)}%` as any, backgroundColor: barColor }]} />
              </View>
              {spent > limit && (
                <Text style={styles.overText}>Over by ₹{(spent - limit).toFixed(0)}</Text>
              )}
            </>
          ) : (
            <Text style={styles.noLimit}>No budget set for this month</Text>
          )}
        </View>

        {/* Daily chart */}
        <DailyChart data={dailyData} month={month} />

        {/* Add expense */}
        <View style={styles.addBox}>
          <Text style={styles.sectionLabel}>Add Expense</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={v => setAmount(sanitize(v))}
          />
          <TextInput
            style={styles.input}
            placeholder="Note (optional)"
            value={note}
            onChangeText={setNote}
          />
          <Pressable style={styles.addBtn} onPress={submitAdd}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {/* Expense list */}
        <Text style={styles.sectionLabel}>Transactions this month</Text>
        {expenses.length === 0 && (
          <Text style={styles.hint}>No expenses yet.</Text>
        )}
        {expenses.map(item => {
          if (editing?.id === item.id) {
            return (
              <View key={item.id} style={[styles.expenseRow, styles.editBox]}>
                <TextInput
                  style={styles.input}
                  value={editing.amount}
                  onChangeText={v => setEditing(e => e && { ...e, amount: sanitize(v) })}
                  keyboardType="decimal-pad"
                  placeholder="Amount (₹)"
                />
                <TextInput
                  style={styles.input}
                  value={editing.note}
                  onChangeText={v => setEditing(e => e && { ...e, note: v })}
                  placeholder="Note"
                />
                <View style={styles.rowActions}>
                  <Pressable style={styles.saveBtn} onPress={submitEdit}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                  <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          if (confirmDeleteId === item.id) {
            return (
              <View key={item.id} style={[styles.expenseRow, styles.confirmRow]}>
                <Text style={styles.confirmText}>Delete this expense?</Text>
                <View style={styles.rowActions}>
                  <Pressable style={styles.deleteConfirmBtn} onPress={() => confirmDelete(item.id)}>
                    <Text style={styles.deleteConfirmText}>Yes</Text>
                  </Pressable>
                  <Pressable style={styles.cancelBtn} onPress={() => setConfirmDeleteId(null)}>
                    <Text style={styles.cancelBtnText}>No</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View key={item.id} style={styles.expenseRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.expenseTop}>
                  <Text style={styles.expenseAmount}>₹{item.amount.toFixed(0)}</Text>
                  <Text style={styles.expenseDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.rowActions}>
                <Pressable onPress={() => setEditing({ id: item.id, amount: String(item.amount), note: item.note ?? '' })}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDeleteId(item.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      <InsultModal visible={!!insult} message={insult ?? ''} onClose={() => setInsult(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 4, marginVertical: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  overText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  noLimit: { fontSize: 13, color: '#94a3b8' },
  addBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 20, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 8 },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 12, fontSize: 15,
  },
  addBtn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 13, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  expenseRow: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  editBox: { borderWidth: 1, borderColor: '#6366f1', gap: 8 },
  confirmRow: { backgroundColor: '#fef2f2' },
  expenseTop: { flexDirection: 'row', justifyContent: 'space-between' },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  expenseDate: { fontSize: 12, color: '#94a3b8' },
  expenseNote: { fontSize: 13, color: '#64748b', marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  editText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  confirmText: { fontSize: 14, color: '#334155', marginBottom: 8 },
  saveBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 8, padding: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  deleteConfirmBtn: { flex: 1, backgroundColor: '#ef4444', borderRadius: 8, padding: 10, alignItems: 'center' },
  deleteConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hint: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 20 },
});
