import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.label, { color: focused ? T.teal : T.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: T.bgCard,
          borderTopWidth: 1,
          borderTopColor: T.border,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen name="index"        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home"  focused={focused} /> }} />
      <Tabs.Screen name="add"          options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="➕" label="Add"   focused={focused} /> }} />
      <Tabs.Screen name="transactions" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Txns"  focused={focused} /> }} />
      <Tabs.Screen name="reports"      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Stats" focused={focused} /> }} />
      <Tabs.Screen name="profile"      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Me"    focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem:        { alignItems: 'center', justifyContent: 'center' },
  iconWrap:       { width: 38, height: 26, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 3 },
  iconWrapActive: { backgroundColor: T.tealGlow },
  emoji:          { fontSize: 18 },
  label:          { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});