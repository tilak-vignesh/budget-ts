import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { initDb } from '../db/schema';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#e2e8f0' },
        headerStyle: { backgroundColor: '#6366f1' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Budget', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarLabel: 'Categories' }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarLabel: 'History' }} />
      <Tabs.Screen name="add-expense" options={{ href: null }} />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="category/[id]" options={{ href: null, title: '' }} />
    </Tabs>
  );
}
