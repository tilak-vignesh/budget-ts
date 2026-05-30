import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getCategories, getBudget, addExpense, getSpentForCategory, type Category } from '../db/queries';
import { currentMonth, randomInsult } from '../constants/insults';
import InsultModal from '../components/InsultModal';

export default function AddExpenseScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const sanitizeAmount = (val: string) => val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [insult, setInsult] = useState<string | null>(null);
  const month = currentMonth();

  useFocusEffect(useCallback(() => {
    getCategories().then(setCategories);
  }, []));

  const submit = async () => {
    if (!selectedId) return Alert.alert('Pick a category');
    const num = parseFloat(amount);
    if (!num || num <= 0) return Alert.alert('Enter a valid amount');

    setSaving(true);
    const budget = await getBudget(selectedId, month);
    if (!budget) {
      setSaving(false);
      return Alert.alert('No budget set', 'Set a limit for this category first (Limits tab).');
    }

    const today = new Date();
    const expenseDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    await addExpense(selectedId, num, note, expenseDate);
    const spent = await getSpentForCategory(selectedId, month);

    setSaving(false);
    setAmount('');
    setNote('');
    setSelectedId(null);

    if (spent > budget.limit_amount) {
      setInsult(randomInsult());
    } else if (spent >= budget.limit_amount) {
      Alert.alert('Limit reached', `You've hit your limit for this category.`);
    } else {
      Alert.alert('Added', 'Expense recorded.');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {categories.map(c => (
          <Pressable
            key={c.id}
            style={[styles.chip, selectedId === c.id && styles.chipActive]}
            onPress={() => setSelectedId(c.id)}
          >
            <Text style={[styles.chipText, selectedId === c.id && styles.chipTextActive]}>
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {categories.length === 0 && (
        <Text style={styles.hint}>Add categories first from the Categories tab.</Text>
      )}

      <Text style={styles.label}>Amount (₹)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0"
        value={amount}
        onChangeText={v => setAmount(sanitizeAmount(v))}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What's this for?"
        value={note}
        onChangeText={setNote}
      />

      <Pressable style={styles.btn} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Expense</Text>}
      </Pressable>

      <InsultModal visible={!!insult} message={insult ?? ''} onClose={() => setInsult(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { color: '#475569', textTransform: 'capitalize', fontSize: 14 },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 14, fontSize: 16,
  },
  btn: {
    marginTop: 32, backgroundColor: '#6366f1',
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { color: '#94a3b8', fontSize: 13 },
});
