import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getCategories, addCategory, deleteCategory, updateCategory,
  setBudget, getBudget, type Category,
} from '../db/queries';
import { currentMonth } from '../constants/insults';

type EditState = { id: number; name: string; limit: string } | null;

const sanitizeAmount = (val: string) => val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

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
    if (!name) return Alert.alert('Enter a category name');
    if (!(limit > 0)) return Alert.alert('Enter a valid monthly limit');
    try {
      await addCategory(name);
      const cats = await getCategories();
      const created = cats.find(c => c.name === name.toLowerCase());
      if (created) await setBudget(created.id, month, limit);
      setNewName('');
      setNewLimit('');
      load();
    } catch {
      Alert.alert('Category already exists');
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
    if (!name) return Alert.alert('Name cannot be empty');
    if (!(limit > 0)) return Alert.alert('Enter a valid limit');
    await updateCategory(editing.id, name);
    await setBudget(editing.id, month, limit);
    setEditing(null);
    load();
  };

  return (
    <View style={styles.container}>
      {/* Add form */}
      <View style={styles.addBox}>
        <Text style={styles.sectionLabel}>New Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Category name"
          value={newName}
          onChangeText={setNewName}
          returnKeyType="next"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Monthly limit (₹)"
          value={newLimit}
          onChangeText={v => setNewLimit(sanitizeAmount(v))}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Pressable style={styles.addBtn} onPress={add}>
          <Text style={styles.addBtnText}>Add Category</Text>
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={categories}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => {
          const isEditing = editing?.id === item.id;
          const isConfirming = confirmDeleteId === item.id;

          if (isEditing) {
            return (
              <View style={styles.editBox}>
                <TextInput
                  style={styles.input}
                  value={editing.name}
                  onChangeText={v => setEditing(e => e && { ...e, name: v })}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  value={editing.limit}
                  onChangeText={v => setEditing(e => e && { ...e, limit: sanitizeAmount(v) })}
                  keyboardType="decimal-pad"
                  placeholder="Monthly limit (₹)"
                />
                <View style={styles.editActions}>
                  <Pressable style={styles.saveBtn} onPress={saveEdit}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </Pressable>
                  <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          if (isConfirming) {
            return (
              <View style={[styles.row, styles.confirmRow]}>
                <Text style={styles.confirmText}>Delete "{item.name}"?</Text>
                <View style={styles.confirmActions}>
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
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.rowActions}>
                <Pressable onPress={() => startEdit(item)} style={styles.actionBtn}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => setConfirmDeleteId(item.id)} style={styles.actionBtn}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.hint}>No categories yet. Add one above.</Text>}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#94a3b8', marginBottom: 8 },
  addBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 20, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  editBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, gap: 10,
    borderWidth: 1, borderColor: '#6366f1',
  },
  input: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 12, fontSize: 15,
  },
  addBtn: { backgroundColor: '#6366f1', borderRadius: 10, padding: 13, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  confirmRow: { backgroundColor: '#fef2f2' },
  name: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  rowActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  editText: { color: '#6366f1', fontSize: 13, fontWeight: '600' },
  deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  confirmText: { fontSize: 14, color: '#334155', flex: 1 },
  confirmActions: { flexDirection: 'row', gap: 8 },
  deleteConfirmBtn: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  deleteConfirmText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  editActions: { flexDirection: 'row', gap: 8 },
  saveBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 8, padding: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  hint: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
