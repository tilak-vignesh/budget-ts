import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getMonthlySummary, type CategorySummary } from '../db/queries';
import { currentMonth } from '../constants/insults';
import { C, FONT } from '../constants/theme';
import CategoryCard from '../components/CategoryCard';

export default function HomeScreen() {
  const [summary, setSummary] = useState<CategorySummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const month = currentMonth();
  const router = useRouter();

  const load = useCallback(async () => {
    setSummary(await getMonthlySummary(month));
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const over = summary.filter(s => s.limit_amount && s.spent > s.limit_amount);
  const warning = summary.filter(s => s.limit_amount && s.spent / s.limit_amount >= 0.8 && s.spent <= s.limit_amount);

  return (
    <View style={styles.container}>
      <Text style={styles.month}>// {month}</Text>

      {over.length > 0 && (
        <View style={[styles.banner, { borderColor: C.danger }]}>
          <Text style={[styles.bannerLabel, { color: C.danger }]}>over_budget</Text>
          <Text style={styles.bannerText}>{over.map(s => s.name).join(', ')}</Text>
        </View>
      )}
      {warning.length > 0 && (
        <View style={[styles.banner, { borderColor: C.amber }]}>
          <Text style={[styles.bannerLabel, { color: C.amber }]}>near_limit</Text>
          <Text style={styles.bannerText}>{warning.map(s => s.name).join(', ')}</Text>
        </View>
      )}

      {summary.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>no categories found</Text>
          <Text style={styles.emptyHint}>→ go to categories to add some</Text>
        </View>
      ) : (
        <FlatList
          data={summary}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <CategoryCard item={item} onPress={() => router.push(`/category/${item.id}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  month: { fontFamily: FONT.mono, fontSize: 12, color: C.textMuted, marginBottom: 16 },
  banner: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10, gap: 2,
  },
  bannerLabel: { fontFamily: FONT.mono, fontSize: 10, fontWeight: '700' },
  bannerText: { fontFamily: FONT.mono, fontSize: 12, color: C.textMuted },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontFamily: FONT.mono, fontSize: 16, color: C.text },
  emptyHint: { fontFamily: FONT.mono, fontSize: 13, color: C.textMuted },
});
