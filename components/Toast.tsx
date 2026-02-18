import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { T } from '../constants/theme';

type ToastType = 'success' | 'delete' | 'error';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide: () => void;
}

const CONFIG: Record<ToastType, { emoji: string; color: string; bg: string }> = {
  success: { emoji: '✦', color: T.teal,    bg: T.tealGlow },
  delete:  { emoji: '✕', color: T.expense, bg: T.expenseGlow },
  error:   { emoji: '!', color: T.gold,    bg: T.goldGlow },
};

export default function Toast({ visible, message, type = 'success', onHide }: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Slide + pop in
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 14 }),
        Animated.spring(scale,      { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 14 }),
        Animated.timing(opacity,    { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Auto hide after 2.2s
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity,    { toValue: 0,   duration: 300, useNativeDriver: true }),
          Animated.timing(scale,      { toValue: 0.8, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide());
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const cfg = CONFIG[type];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }, { scale }] }]}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
        <Text style={[styles.icon, { color: cfg.color }]}>{cfg.emoji}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      <View style={[styles.bar, { backgroundColor: cfg.color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bgCard,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: T.border,
    minWidth: 220,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  icon:    { fontSize: 14, fontWeight: '900' },
  message: { flex: 1, fontSize: 14, fontWeight: '600', color: T.textPrimary },
  bar: {
    position: 'absolute', bottom: 0, left: 0,
    width: '100%', height: 2, borderRadius: 1,
  },
});