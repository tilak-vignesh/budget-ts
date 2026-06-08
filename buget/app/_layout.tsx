import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { initDb } from '../db/schema';
import { C } from '../constants/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDb().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.border, borderTopWidth: 1 },
        tabBarLabelStyle: { fontFamily: 'monospace', fontSize: 10 },
        headerStyle: { backgroundColor: C.surface },
        headerTintColor: C.text,
        headerTitleStyle: { fontFamily: 'monospace', fontWeight: '700', letterSpacing: 1 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'buget',
          tabBarLabel: 'home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'categories',
          tabBarLabel: 'categories',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'history',
          tabBarLabel: 'history',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="add-expense" options={{ href: null }} />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="category/[id]" options={{ href: null, title: '' }} />
    </Tabs>
  );
}
