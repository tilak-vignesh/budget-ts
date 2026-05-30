import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getCategories, addCategory, deleteCategory, updateCategory,
  setBudget, getBudget, type Category,
} from '../db/queries';
import { currentMonth } from '../constants/insults';
import { C, FONT } from '../constants/theme';

type EditState = { id: number; name: string; limit: string } | null;
const sanitize = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<EditState>(null);
  const month = currentMonth();

  const load = useCallback(async () => {
    setCategories(await getCategories());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const add = async () => {
    const name = newName.trim();
    const limit = parseFloat(newLimit);
    if (!name) return Alert.alert('enter a name');
    if (!(limit > 0)) return Alert.alert('enter a valid limit');
    try {
      await addCategory(name);
      const cats = await getCategories();
      const created = cats.find(c => c.name === name.toLowerCase());
      if (created) await setBudget(created.id, month, limit);
      setNewName('');
      setNewLimit('');
      load();
    } catch {
      Alert.alert('category already exists');
    }
  };

  const confirmDelete = async (id: number) => {
    await deleteCategory(id);
    setConfirmDeleteId(null);
    load();
  };

  const startEdit = async (item: Category) => {
    const b = await getBudget(item.id, month);
    setEditing({ id: item.id, name: item.name, limit: b ? String(b.limit_amount) : '' });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    const limit = parseFloat(editing.limit);
    if (!name) return Alert.alert('name cannot be empty');
    if (!(limit > 0)) return Alert.alert('enter a valid limit');
    await updateCategory(editing.id, name);
    await setBudget(editing.id, month, limit);
    setEditing(null);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.addBox}>
        <Text style={styles.sectionLabel}>// new_category</Text>
        <TextInput style={styles.input} placeholder="name" placeholderTextColor={C.textMuted}
          value={newName} onChangeText={setNewName} returnKeyType="next" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="monthly_limit (₹)" placeholderTextColor={C.textMuted}
          value={newLimit} onChangeText={v => setNewLimit(sanitize(v))}
          keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={add} />
        <Pressable style={styles.addBtn} onPress={add}>
          <Text style={styles.addBtnText}>$ add</Text>
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => {
          if (editing?.id === item.id) {
            return (
              <View style={[styles.row, styles.editRow]}>
                <Text style={styles.sectionLabel}>// editing</Text>
                <TextInput style={styles.input} value={editing.name} autoCapitalize="none"
                  placeholderTextColor={C.textMuted}
                  onChangeText={v => setEditing(e => e && { ...e, name: v })} />
                <TextInput style={styles.input} value={editing.limit} keyboardType="decimal-pad"
                  placeholder="limit (₹)" placeholderTextColor={C.textMuted}
                  onChangeText={v => setEditing(e => e && { ...e, limit: sanitize(v) })} />
                <View style={styles.actions}>
                  <Pressable style={styles.accentBtn} onPress={saveEdit}>
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
              <View style={[styles.row, styles.dangerRow]}>
                <Text style={styles.confirmText}>delete "{item.name}"?</Text>
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
            <View style={styles.row}>
              <Text style={styles.catName}>{item.name}</Text>
              <View style={styles.rowBtns}>
                <Pressable onPress={() => startEdit(item)}>
                  <Text style={styles.editText}>edit</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDeleteId(item.id)}>
                  <Text style={styles.deleteText}>delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.hint}>no categories yet</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  sectionLabel: { fontFamily: FONT.mono, fontSize: 10, color: C.textMuted, marginBottom: 10 },
  addBox: {
    backgroundColor: C.surface, borderRadius: 8, padding: 14,
    marginBottom: 20, gap: 10, borderWidth: 1, borderColor: C.border,
  },
  editRow: { borderColor: C.accent, gap: 10 },
  dangerRow: { borderColor: C.danger },
  input: {
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    borderRadius: 6, padding: 12, fontSize: 14, fontFamily: FONT.mono, color: C.text,
  },
  addBtn: { borderWidth: 1, borderColor: C.accent, borderRadius: 6, padding: 12, alignItems: 'center' },
  addBtnText: { fontFamily: FONT.mono, color: C.accent, fontSize: 13 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 8, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  catName: { fontFamily: FONT.mono, fontSize: 14, color: C.text },
  rowBtns: { flexDirection: 'row', gap: 16 },
  editText: { fontFamily: FONT.mono, fontSize: 12, color: C.accent },
  deleteText: { fontFamily: FONT.mono, fontSize: 12, color: C.danger },
  confirmText: { fontFamily: FONT.mono, fontSize: 13, color: C.text, flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  accentBtn: { flex: 1, borderWidth: 1, borderColor: C.accent, borderRadius: 6, padding: 10, alignItems: 'center' },
  accentBtnText: { fontFamily: FONT.mono, color: C.accent, fontSize: 13 },
  ghostBtn: { flex: 1, borderWidth: 1, borderColor: C.border2, borderRadius: 6, padding: 10, alignItems: 'center' },
  ghostBtnText: { fontFamily: FONT.mono, color: C.textMuted, fontSize: 13 },
  dangerBtn: { flex: 1, borderWidth: 1, borderColor: C.danger, borderRadius: 6, padding: 10, alignItems: 'center' },
  dangerBtnText: { fontFamily: FONT.mono, color: C.danger, fontSize: 13 },
  hint: { fontFamily: FONT.mono, fontSize: 13, color: C.textMuted, textAlign: 'center', marginTop: 40 },
});
