import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getMonthlySummary, type CategorySummary } from '../db/queries';
import { currentMonth } from '../constants/insults';
import CategoryCard from '../components/CategoryCard';

export default function HomeScreen() {
  const [summary, setSummary] = useState<CategorySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const month = currentMonth();
  const router = useRouter();

  const load = useCallback(async () => {
    const data = await getMonthlySummary(month);
    setSummary(data);
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const over = summary.filter(s => s.limit_amount && s.spent > s.limit_amount);
  const warning = summary.filter(s => s.limit_amount && s.spent / s.limit_amount >= 0.8 && s.spent <= s.limit_amount);

  return (
    <View style={styles.container}>
      <Text style={styles.month}>{month}</Text>

      {over.length > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Over budget: {over.map(s => s.name).join(', ')}
          </Text>
        </View>
      )}
      {warning.length > 0 && (
        <View style={[styles.banner, styles.warnBanner]}>
          <Text style={styles.bannerText}>
            Almost full: {warning.map(s => s.name).join(', ')}
          </Text>
        </View>
      )}

      {summary.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No categories yet.</Text>
          <Text style={styles.emptyHint}>Go to Categories tab to add some.</Text>
        </View>
      ) : (
        <FlatList
          data={summary}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <CategoryCard item={item} onPress={() => router.push(`/category/${item.id}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  month: { fontSize: 13, color: '#94a3b8', marginBottom: 12, fontWeight: '600' },
  banner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  warnBanner: { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' },
  bannerText: { fontSize: 13, color: '#334155' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#334155' },
  emptyHint: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
});
