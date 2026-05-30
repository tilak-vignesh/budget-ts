import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getCategories, getBudget, setBudget, type Category } from '../db/queries';
import { currentMonth } from '../constants/insults';

type Entry = Category & { limit: string };

export default function BudgetScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const month = currentMonth();

  useFocusEffect(useCallback(() => {
    (async () => {
      const cats = await getCategories();
      const enriched = await Promise.all(
        cats.map(async c => {
          const b = await getBudget(c.id, month);
          return { ...c, limit: b ? String(b.limit_amount) : '' };
        })
      );
      setEntries(enriched);
    })();
  }, [month]));

  const update = (id: number, val: string) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, limit: val } : e)));
  };

  const save = async () => {
    setSaving(true);
    for (const e of entries) {
      const num = parseFloat(e.limit);
      if (num > 0) await setBudget(e.id, month, num);
    }
    setSaving(false);
    Alert.alert('Saved', 'Budgets updated.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sub}>Set limits for {month}</Text>
      <FlatList
        data={entries}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="₹ limit"
              value={item.limit}
              onChangeText={v => update(item.id, v)}
            />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.hint}>No categories yet. Add some first.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      {entries.length > 0 && (
        <Pressable style={styles.btn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Limits</Text>}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  sub: { fontSize: 13, color: '#94a3b8', marginBottom: 16, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  name: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize', flex: 1 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    padding: 10, width: 110, fontSize: 15, textAlign: 'right',
  },
  btn: {
    backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
