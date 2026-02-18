import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDashboardStats, getTransactions } from '../../services/api';
import { T } from '../../constants/theme';

const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍', Bills: '📄',
  Entertainment: '🎬', Health: '💊', Salary: '💼', Freelance: '💻',
  Investment: '📈', Gift: '🎁', Other: '📦',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({ balance: 0, totalIncome: 0, totalExpense: 0, byCategory: {} });
  const [recent, setRecent] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const userData = await AsyncStorage.getItem('user');
      setUser(userData ? JSON.parse(userData) : { name: 'User', currency: '₹' });
      const [s, t] = await Promise.allSettled([getDashboardStats(), getTransactions()]);
      if (s.status === 'fulfilled') setStats(s.value.data);
      if (t.status === 'fulfilled') setRecent(t.value.data.slice(0, 5));
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      }},
    ]);
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={T.teal} />
    </View>
  );

  const cur = user?.currency || '₹';
  const balance = stats?.balance ?? 0;
  const totalIncome = stats?.totalIncome ?? 0;
  const totalExpense = stats?.totalExpense ?? 0;
  const topCategories = Object.entries(stats?.byCategory || {})
    .sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={T.teal} />}
      >
        <View style={styles.header}>
          <View style={styles.headerBg} />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good {getGreeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'} 👋</Text>
            </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatarBtn}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <Text style={[styles.balanceAmount, { color: balance >= 0 ? T.teal : T.expense }]}>
              {cur}{Math.abs(balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <View style={[styles.statDot, { backgroundColor: T.income }]} />
                <View>
                  <Text style={styles.statPillLabel}>Income</Text>
                  <Text style={[styles.statPillAmt, { color: T.income }]}>{cur}{totalIncome.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statPill}>
                <View style={[styles.statDot, { backgroundColor: T.expense }]} />
                <View>
                  <Text style={styles.statPillLabel}>Expenses</Text>
                  <Text style={[styles.statPillAmt, { color: T.expense }]}>{cur}{totalExpense.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(0,212,180,0.3)' }]}
              onPress={() => router.push({ pathname: '/(tabs)/add', params: { type: 'income' } })}>
              <View style={[styles.actionIcon, { backgroundColor: T.tealGlow }]}>
                <Text style={{ fontSize: 22, color: T.income }}>↑</Text>
              </View>
              <Text style={[styles.actionLabel, { color: T.income }]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(255,94,125,0.3)' }]}
              onPress={() => router.push({ pathname: '/(tabs)/add', params: { type: 'expense' } })}>
              <View style={[styles.actionIcon, { backgroundColor: T.expenseGlow }]}>
                <Text style={{ fontSize: 22, color: T.expense }}>↓</Text>
              </View>
              <Text style={[styles.actionLabel, { color: T.expense }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderColor: 'rgba(245,200,66,0.3)' }]}
              onPress={() => router.push('/(tabs)/reports')}>
              <View style={[styles.actionIcon, { backgroundColor: T.goldGlow }]}>
                <Text style={{ fontSize: 22, color: T.gold }}>◎</Text>
              </View>
              <Text style={[styles.actionLabel, { color: T.gold }]}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { borderColor: T.border }]}
              onPress={() => router.push('/(tabs)/transactions')}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(136,146,170,0.1)' }]}>
                <Text style={{ fontSize: 22, color: T.textSecondary }}>≡</Text>
              </View>
              <Text style={[styles.actionLabel, { color: T.textSecondary }]}>History</Text>
            </TouchableOpacity>
          </View>

          {topCategories.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>TOP SPENDING</Text>
              <View style={styles.categoryCard}>
                {topCategories.map(([cat, amt]: any, i) => {
                  const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                  return (
                    <View key={cat} style={[styles.catRow, i < topCategories.length - 1 && styles.catRowBorder]}>
                      <Text style={styles.catEmoji}>{CATEGORY_ICONS[cat] || '📦'}</Text>
                      <View style={styles.catMiddle}>
                        <Text style={styles.catName}>{cat}</Text>
                        <View style={styles.catBar}>
                          <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: T.expense }]} />
                        </View>
                      </View>
                      <Text style={styles.catAmt}>{cur}{amt.toLocaleString('en-IN')}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Start by adding your first income or expense</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push({ pathname: '/(tabs)/add', params: { type: 'expense' } })}>
                <Text style={styles.emptyBtnText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.txList}>
              {recent.map((item, i) => (
                <TouchableOpacity key={item._id} style={[styles.txItem, i < recent.length - 1 && styles.txItemBorder]}
                  onPress={() => router.push({ pathname: '/(tabs)/add', params: { type: item.type, editId: item._id } })}>
                  <View style={[styles.txIcon, { backgroundColor: item.type === 'income' ? T.incomeGlow : T.expenseGlow }]}>
                    <Text style={styles.txIconText}>{CATEGORY_ICONS[item.category] || (item.type === 'income' ? '↑' : '↓')}</Text>
                  </View>
                  <View style={styles.txMiddle}>
                    <Text style={styles.txTitle}>{item.title}</Text>
                    <Text style={styles.txMeta}>{item.category} · {formatDate(item.date)}</Text>
                  </View>
                  <Text style={[styles.txAmt, { color: item.type === 'income' ? T.income : T.expense }]}>
                    {item.type === 'income' ? '+' : '-'}{cur}{item.amount.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  scroll: { flex: 1 },
  header: { paddingBottom: 100 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, backgroundColor: T.bgCard },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20 },
  greeting: { color: T.textSecondary, fontSize: 13, letterSpacing: 0.5 },
  userName: { color: T.textPrimary, fontSize: 22, fontWeight: '800' },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: T.teal, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: T.bg, fontSize: 16, fontWeight: '800' },
  balanceCard: { marginHorizontal: 20, backgroundColor: T.bgElevated, borderRadius: T.radiusLg, padding: 22, borderWidth: 1, borderColor: T.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 12 },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 1.5, marginBottom: 8 },
  balanceAmount: { fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statPillLabel: { fontSize: 11, color: T.textMuted, marginBottom: 2 },
  statPillAmt: { fontSize: 16, fontWeight: '700' },
  statDivider: { width: 1, height: 36, backgroundColor: T.border, marginHorizontal: 16 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 1.5, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll: { fontSize: 13, color: T.teal, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionCard: { flex: 1, backgroundColor: T.bgCard, borderRadius: T.radius, padding: 14, alignItems: 'center', borderWidth: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  categoryCard: { backgroundColor: T.bgCard, borderRadius: T.radius, marginBottom: 28, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  catRowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  catEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
  catMiddle: { flex: 1 },
  catName: { fontSize: 14, color: T.textPrimary, fontWeight: '600', marginBottom: 6 },
  catBar: { height: 4, backgroundColor: T.border, borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: 4, borderRadius: 2 },
  catAmt: { fontSize: 14, fontWeight: '700', color: T.textPrimary },
  txList: { backgroundColor: T.bgCard, borderRadius: T.radius, borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginBottom: 20 },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  txItemBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  txIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txIconText: { fontSize: 20 },
  txMiddle: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '600', color: T.textPrimary },
  txMeta: { fontSize: 12, color: T.textSecondary, marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '700' },
  emptyCard: { backgroundColor: T.bgCard, borderRadius: T.radiusLg, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: T.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: T.teal, paddingHorizontal: 24, paddingVertical: 12, borderRadius: T.radius },
  emptyBtnText: { color: T.bg, fontWeight: '800', fontSize: 14 },
});