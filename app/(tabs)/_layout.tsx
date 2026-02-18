import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useEffect } from 'react';
import { T } from '../../constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (focused) {
      // Scale spring — native driver only, no color
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.25, useNativeDriver: true, speed: 20, bounciness: 12 }),
        Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, speed: 20, bounciness: 4 }),
      ]).start();
      // Opacity separately — also native driver safe
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
      Animated.timing(opacityAnim, { toValue: 0.5, duration: 150, useNativeDriver: true }).start();
    }
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[
        styles.iconWrap,
        focused && styles.iconWrapActive,   // ← static bg color, no animation needed
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
      <Animated.Text style={[
        styles.label,
        { color: focused ? T.teal : T.textMuted, opacity: opacityAnim }
      ]}>
        {label}
      </Animated.Text>
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
        // ✅ Fade animation between tabs
        animation: 'fade',
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
      // ✅ No white flash between tab switches
      sceneContainerStyle={{ backgroundColor: T.bg }}
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
  tabItem:  { alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 42, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 3 },
  emoji:    { fontSize: 18 },
  label:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
});