import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from '../../constants/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(u => { if (u) setUser(JSON.parse(u)); });
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }},
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>✦ FlowTrack Member</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.name || '—'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>{user?.currency || '₹'} INR</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>APP INFO</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>FlowTrack</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stack</Text>
            <Text style={styles.infoValue}>React Native + Expo</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
  crafted with <Text style={styles.heart}>♥</Text> by{'\n'}
  <Text style={styles.footerName}>Shaurya Tiwari</Text>
</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: T.bgCard, borderBottomWidth: 1, borderBottomColor: T.border },
  headerTitle: { fontSize: 26, fontWeight: '900', color: T.textPrimary },
  avatarSection: { alignItems: 'center', paddingVertical: 36 },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: T.teal, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: T.teal, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: T.tealGlow, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, fontWeight: '800', color: T.teal },
  userName: { fontSize: 22, fontWeight: '800', color: T.textPrimary, marginBottom: 4 },
  userEmail: { fontSize: 14, color: T.textSecondary, marginBottom: 12 },
  memberBadge: { backgroundColor: T.goldGlow, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: T.gold + '40' },
  memberBadgeText: { fontSize: 12, color: T.gold, fontWeight: '700', letterSpacing: 0.5 },
  infoCard: { backgroundColor: T.bgCard, marginHorizontal: 20, marginBottom: 16, borderRadius: T.radius, padding: 18, borderWidth: 1, borderColor: T.border },
  cardTitle: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 1.5, marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  infoDivider: { height: 1, backgroundColor: T.border },
  infoLabel: { fontSize: 14, color: T.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: T.textPrimary },
  currencyBadge: { backgroundColor: T.tealGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currencyText: { fontSize: 13, fontWeight: '700', color: T.teal },
  logoutBtn: { marginHorizontal: 20, marginTop: 8, paddingVertical: 16, borderRadius: T.radius, alignItems: 'center', backgroundColor: 'rgba(255,94,125,0.1)', borderWidth: 1.5, borderColor: T.expense + '60' },
  logoutText: { color: T.expense, fontSize: 16, fontWeight: '800' },
footer: { textAlign: 'center', color: T.textMuted, fontSize: 12, marginTop: 24, marginBottom: 40, lineHeight: 22 },
heart: { color: T.expense, fontSize: 13 },
footerName: { color: T.teal, fontSize: 14, fontWeight: '800', letterSpacing: 1.5 }
});