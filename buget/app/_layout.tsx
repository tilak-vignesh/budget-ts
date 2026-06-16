import { useEffect } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../constants/theme';

function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login';
  };
  if (Platform.OS !== 'web') return null;
  return (
    <Pressable onPress={handleLogout} style={{ paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: 'monospace', fontSize: 12, color: C.textMuted }}>logout</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Fix mobile browser viewport clipping: `100%` height is based on the
    // initial viewport including browser chrome, so content gets cut off.
    // `100dvh` (dynamic viewport height) updates as chrome shows/hides.
    const style = document.createElement('style');
    style.textContent = '#root { min-height: 100dvh; }';
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

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
          headerRight: () => <LogoutButton />,
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
