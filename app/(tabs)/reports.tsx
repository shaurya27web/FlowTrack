import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDashboardStats } from '../../services/api';
import { T } from '../../constants/theme';

const CAT_ICONS: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍', Bills: '📄',
  Entertainment: '🎬', Health: '💊', Salary: '💼', Freelance: '💻',
  Investment: '📈', Gift: '🎁', Other: '📦',
};
const COLORS = [T.expense, T.teal, T.gold, '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export default function ReportsScreen() {
  const [loading, setLoading]   = useState(true);
  const [stats, setStats]       = useState<any>(null);
  const [currency, setCurrency] = useState('₹');

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const u = await AsyncStorage.getItem('user');
      if (u) setCurrency(JSON.parse(u).currency || '₹');
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const res = await getDashboardStats();
      setStats(res.data);
    } catch { }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={T.teal} /></View>;

  const byCategory   = stats?.byCategory || {};
  const totalExpense = stats?.totalExpense || 0;
  const totalIncome  = stats?.totalIncome || 0;
  const balance      = stats?.balance || 0;
  const savingsRate  = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;
  const categoryEntries = Object.entries(byCategory).sort((a: any, b: any) => b[1] - a[1]) as [string, number][];
  const monthName = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSub}>{monthName}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderColor: T.income + '40' }]}>
            <Text style={styles.metricLabel}>INCOME</Text>
            <Text style={[styles.metricValue, { color: T.income }]}>{currency}{totalIncome.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: T.expense + '40' }]}>
            <Text style={styles.metricLabel}>SPENT</Text>
            <Text style={[styles.metricValue, { color: T.expense }]}>{currency}{totalExpense.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.savingsCard}>
          <View style={styles.savingsTop}>
            <View>
              <Text style={styles.savingsLabel}>SAVINGS RATE</Text>
              <Text style={[styles.savingsRate, { color: savingsRate >= 0 ? T.teal : T.expense }]}>{savingsRate}%</Text>
            </View>
            <View style={styles.savingsRight}>
              <Text style={styles.savingsSubLabel}>Net Saved</Text>
              <Text style={[styles.savingsAmt, { color: balance >= 0 ? T.teal : T.expense }]}>
                {balance >= 0 ? '+' : ''}{currency}{Math.abs(balance).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.savingsBarBg}>
            <View style={[styles.savingsBarFill, { width: `${Math.min(Math.max(savingsRate, 0), 100)}%`, backgroundColor: savingsRate >= 20 ? T.teal : savingsRate >= 0 ? T.gold : T.expense }]} />
          </View>
          <Text style={styles.savingsHint}>
            {savingsRate >= 30 ? '🎉 Excellent savings!' : savingsRate >= 20 ? '👍 Good progress' : savingsRate >= 0 ? '⚠️ Try to save more' : '🚨 Spending exceeds income'}
          </Text>
        </View>

        {categoryEntries.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>EXPENSE BREAKDOWN</Text>
            <View style={styles.breakdownCard}>
              {categoryEntries.map(([cat, amt], i) => {
                const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
                const color = COLORS[i % COLORS.length];
                return (
                  <View key={cat} style={[styles.breakdownRow, i < categoryEntries.length - 1 && styles.rowBorder]}>
                    <Text style={styles.breakdownEmoji}>{CAT_ICONS[cat] || '📦'}</Text>
                    <View style={styles.breakdownMiddle}>
                      <View style={styles.breakdownLabelRow}>
                        <Text style={styles.breakdownCat}>{cat}</Text>
                        <Text style={styles.breakdownPct}>{pct.toFixed(1)}%</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                    </View>
                    <Text style={[styles.breakdownAmt, { color }]}>{currency}{amt.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>LEGEND</Text>
            <View style={styles.legendCard}>
              {categoryEntries.slice(0, 6).map(([cat, amt], i) => (
                <View key={cat} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                  <Text style={styles.legendCat}>{CAT_ICONS[cat] || '📦'} {cat}</Text>
                  <Text style={styles.legendAmt}>{currency}{amt.toLocaleString('en-IN')}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No expense data yet</Text>
            <Text style={styles.emptySub}>Add transactions to see your spending breakdown</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: T.bgCard, borderBottomWidth: 1, borderBottomColor: T.border },
  headerTitle: { fontSize: 26, fontWeight: '900', color: T.textPrimary },
  headerSub: { fontSize: 13, color: T.textSecondary, marginTop: 3 },
  metricsRow: { flexDirection: 'row', gap: 12, margin: 20, marginBottom: 12 },
  metricCard: { flex: 1, backgroundColor: T.bgCard, borderRadius: T.radius, padding: 16, borderWidth: 1 },
  metricLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, letterSpacing: 1, marginBottom: 8 },
  metricValue: { fontSize: 20, fontWeight: '800' },
  savingsCard: { backgroundColor: T.bgCard, marginHorizontal: 20, marginBottom: 20, borderRadius: T.radius, padding: 18, borderWidth: 1, borderColor: T.border },
  savingsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  savingsLabel: { fontSize: 10, fontWeight: '700', color: T.textMuted, letterSpacing: 1, marginBottom: 6 },
  savingsRate: { fontSize: 36, fontWeight: '900' },
  savingsRight: { alignItems: 'flex-end' },
  savingsSubLabel: { fontSize: 11, color: T.textMuted, marginBottom: 4 },
  savingsAmt: { fontSize: 18, fontWeight: '800' },
  savingsBarBg: { height: 8, backgroundColor: T.border, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  savingsBarFill: { height: 8, borderRadius: 4 },
  savingsHint: { fontSize: 13, color: T.textSecondary },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 1.5, marginHorizontal: 20, marginBottom: 12 },
  breakdownCard: { backgroundColor: T.bgCard, marginHorizontal: 20, marginBottom: 20, borderRadius: T.radius, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: T.border },
  breakdownEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  breakdownMiddle: { flex: 1 },
  breakdownLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  breakdownCat: { fontSize: 14, fontWeight: '600', color: T.textPrimary },
  breakdownPct: { fontSize: 12, color: T.textSecondary, fontWeight: '600' },
  barBg: { height: 5, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  breakdownAmt: { fontSize: 14, fontWeight: '700', minWidth: 70, textAlign: 'right' },
  legendCard: { backgroundColor: T.bgCard, marginHorizontal: 20, marginBottom: 20, borderRadius: T.radius, padding: 16, borderWidth: 1, borderColor: T.border, gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendCat: { flex: 1, fontSize: 13, color: T.textSecondary },
  legendAmt: { fontSize: 13, fontWeight: '700', color: T.textPrimary },
  emptyCard: { alignItems: 'center', padding: 50 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textSecondary, textAlign: 'center', lineHeight: 20 },
});