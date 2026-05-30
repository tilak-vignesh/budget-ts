import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useFocusEffect } from 'expo-router';
import {
  getMonthlySummary, getExpensesByMonth, addExpense, updateExpense,
  deleteExpense, getBudget, getSpentForCategory, getDailySpend, type Expense,
} from '../../db/queries';
import { currentMonth, randomInsult } from '../../constants/insults';
import { C, FONT } from '../../constants/theme';
import InsultModal from '../../components/InsultModal';
import DailyChart from '../../components/DailyChart';
import DatePicker from '../../components/DatePicker';

type ExpenseWithCat = Expense & { category_name: string };
type EditState = { id: number; amount: string; note: string; expense_date: string } | null;
const sanitize = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const catId = Number(id);
  const navigation = useNavigation();
  const month = currentMonth();

  const [spent, setSpent] = useState(0);
  const [limit, setLimit] = useState(0);
  const [expenses, setExpenses] = useState<ExpenseWithCat[]>([]);
  const [dailyData, setDailyData] = useState<{ day: number; total: number }[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [editing, setEditing] = useState<EditState>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [insult, setInsult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [summary, allExpenses, budget, daily] = await Promise.all([
      getMonthlySummary(month),
      getExpensesByMonth(month),
      getBudget(catId, month),
      getDailySpend(catId, month),
    ]);
    const cat = summary.find(s => s.id === catId);
    if (cat) {
      setSpent(cat.spent);
      navigation.setOptions({ title: cat.name });
    }
    setLimit(budget?.limit_amount ?? 0);
    setExpenses(allExpenses.filter(e => e.category_id === catId));
    setDailyData(daily);
  }, [catId, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitAdd = async () => {
    const num = parseFloat(amount);
    if (!(num > 0)) return Alert.alert('enter a valid amount');
    await addExpense(catId, num, note, expenseDate);
    const expMonth = expenseDate.slice(0, 7);
    const newSpent = await getSpentForCategory(catId, expMonth);
    const budget = await getBudget(catId, expMonth);
    setAmount('');
    setNote('');
    setExpenseDate(todayStr());
    await load();
    if (budget && newSpent > budget.limit_amount) setInsult(randomInsult());
    else if (budget && newSpent >= budget.limit_amount) Alert.alert('limit reached', "you've hit your limit.");
  };

  const submitEdit = async () => {
    if (!editing) return;
    const num = parseFloat(editing.amount);
    if (!(num > 0)) return Alert.alert('enter a valid amount');
    await updateExpense(editing.id, num, editing.note, editing.expense_date);
    setEditing(null);
    load();
  };

  const confirmDelete = async (expId: number) => {
    await deleteExpense(expId);
    setConfirmDeleteId(null);
    load();
  };

  const ratio = limit > 0 ? spent / limit : 0;
  const barColor = ratio >= 1 ? C.danger : ratio >= 0.8 ? C.amber : C.accent;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Summary */}
        <View style={styles.card}>
          {limit > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.label}>spent</Text>
                  <Text style={[styles.bigNum, { color: barColor }]}>₹{spent.toFixed(0)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.label}>limit</Text>
                  <Text style={styles.bigNum}>₹{limit.toFixed(0)}</Text>
                </View>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.min(ratio * 100, 100)}%` as any, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.label, { color: ratio >= 1 ? C.danger : C.textMuted }]}>
                {ratio >= 1
                  ? `over by ₹${(spent - limit).toFixed(0)}`
                  : `₹${(limit - spent).toFixed(0)} remaining`}
              </Text>
            </>
          ) : (
            <Text style={styles.label}>no budget set for this month</Text>
          )}
        </View>

        {/* Chart */}
        <DailyChart data={dailyData} month={month} />

        {/* Add expense */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>// add_expense</Text>
          <TextInput style={styles.input} placeholder="amount (₹)" placeholderTextColor={C.textMuted}
            keyboardType="decimal-pad" value={amount} onChangeText={v => setAmount(sanitize(v))} />
          <TextInput style={styles.input} placeholder="note (optional)" placeholderTextColor={C.textMuted}
            value={note} onChangeText={setNote} />
          <DatePicker value={expenseDate} onChange={setExpenseDate} />
          <Pressable style={styles.addBtn} onPress={submitAdd}>
            <Text style={styles.addBtnText}>$ add</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionLabel}>// transactions</Text>
        {expenses.length === 0 && <Text style={styles.hint}>no expenses yet</Text>}

        {expenses.map(item => {
          if (editing?.id === item.id) {
            return (
              <View key={item.id} style={[styles.expRow, styles.editRow]}>
                <Text style={styles.sectionLabel}>// editing</Text>
                <TextInput style={styles.input} value={editing.amount} keyboardType="decimal-pad"
                  placeholder="amount (₹)" placeholderTextColor={C.textMuted}
                  onChangeText={v => setEditing(e => e && { ...e, amount: sanitize(v) })} />
                <TextInput style={styles.input} value={editing.note} placeholder="note"
                  placeholderTextColor={C.textMuted}
                  onChangeText={v => setEditing(e => e && { ...e, note: v })} />
                <DatePicker value={editing.expense_date} onChange={v => setEditing(e => e && { ...e, expense_date: v })} />
                <View style={styles.actions}>
                  <Pressable style={styles.accentBtn} onPress={submitEdit}>
                    <Text style={styles.accentBtnText}>$ save</Text>
                  </Pressable>
                  <Pressable style={styles.ghostBtn} onPress={() => setEditing(null)}>
                    <Text style={styles.ghostBtnText}>cancel</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          if (confirmDeleteId === item.id) {
            return (
              <View key={item.id} style={[styles.expRow, styles.dangerRow]}>
                <Text style={styles.confirmText}>delete this expense?</Text>
                <View style={styles.actions}>
                  <Pressable style={styles.dangerBtn} onPress={() => confirmDelete(item.id)}>
                    <Text style={styles.dangerBtnText}>yes</Text>
                  </Pressable>
                  <Pressable style={styles.ghostBtn} onPress={() => setConfirmDeleteId(null)}>
                    <Text style={styles.ghostBtnText}>no</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View key={item.id} style={styles.expRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.expTop}>
                  <Text style={styles.expAmount}>₹{item.amount.toFixed(0)}</Text>
                  <Text style={styles.expDate}>{item.expense_date ?? new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                {item.note ? <Text style={styles.expNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.rowBtns}>
                <Pressable onPress={() => setEditing({ id: item.id, amount: String(item.amount), note: item.note ?? '', expense_date: item.expense_date ?? todayStr() })}>
                  <Text style={styles.editText}>edit</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDeleteId(item.id)}>
                  <Text style={styles.deleteText}>del</Text>
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
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  card: {
    backgroundColor: C.surface, borderRadius: 8, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: C.border, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: FONT.mono, fontSize: 10, color: C.textMuted },
  bigNum: { fontFamily: FONT.mono, fontSize: 26, fontWeight: '700', color: C.text, marginTop: 2 },
  barBg: { height: 2, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  sectionLabel: { fontFamily: FONT.mono, fontSize: 10, color: C.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, padding: 12, fontFamily: FONT.mono, fontSize: 14, color: C.text,
  },
  addBtn: { borderWidth: 1, borderColor: C.accent, borderRadius: 6, padding: 12, alignItems: 'center' },
  addBtnText: { fontFamily: FONT.mono, color: C.accent, fontSize: 13 },
  expRow: {
    backgroundColor: C.surface, borderRadius: 8, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  editRow: { borderColor: C.accent, gap: 8 },
  dangerRow: { borderColor: C.danger },
  expTop: { flexDirection: 'row', justifyContent: 'space-between' },
  expAmount: { fontFamily: FONT.mono, fontSize: 15, fontWeight: '700', color: C.text },
  expDate: { fontFamily: FONT.mono, fontSize: 11, color: C.textMuted },
  expNote: { fontFamily: FONT.mono, fontSize: 12, color: C.textMuted, marginTop: 3 },
  rowBtns: { flexDirection: 'row', gap: 14, marginTop: 8 },
  editText: { fontFamily: FONT.mono, fontSize: 12, color: C.accent },
  deleteText: { fontFamily: FONT.mono, fontSize: 12, color: C.danger },
  confirmText: { fontFamily: FONT.mono, fontSize: 13, color: C.text, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  accentBtn: { flex: 1, borderWidth: 1, borderColor: C.accent, borderRadius: 6, padding: 10, alignItems: 'center' },
  accentBtnText: { fontFamily: FONT.mono, color: C.accent, fontSize: 13 },
  ghostBtn: { flex: 1, borderWidth: 1, borderColor: C.border2, borderRadius: 6, padding: 10, alignItems: 'center' },
  ghostBtnText: { fontFamily: FONT.mono, color: C.textMuted, fontSize: 13 },
  dangerBtn: { flex: 1, borderWidth: 1, borderColor: C.danger, borderRadius: 6, padding: 10, alignItems: 'center' },
  dangerBtnText: { fontFamily: FONT.mono, color: C.danger, fontSize: 13 },
  hint: { fontFamily: FONT.mono, fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 20 },
});
