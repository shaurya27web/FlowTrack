import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, StatusBar, Animated, Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactions, deleteTransaction } from '../../services/api';
import { T } from '../../constants/theme';
import Toast from '../../components/Toast';

const CAT_ICONS: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍', Bills: '📄',
  Entertainment: '🎬', Health: '💊', Salary: '💼', Freelance: '💻',
  Investment: '📈', Gift: '🎁', Other: '📦',
};

type Filter = 'all' | 'income' | 'expense';

// ── Custom Delete Confirm Modal ───────────────────────────────────────────────
function DeleteModal({ visible, onCancel, onConfirm }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,   useNativeDriver: true, speed: 20, bounciness: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,   { toValue: 0.8, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,   duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={modal.overlay}>
        <Animated.View style={[modal.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Icon */}
          <View style={modal.iconWrap}>
            <Text style={modal.iconEmoji}>🗑</Text>
          </View>
          <Text style={modal.title}>Delete Transaction</Text>
          <Text style={modal.subtitle}>This action cannot be undone.</Text>

          {/* Buttons */}
          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modal.deleteBtn} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={modal.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filtered, setFiltered]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState<Filter>('all');
  const [currency, setCurrency]         = useState('₹');
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [toast, setToast]               = useState({ visible: false, message: '', type: 'success' as 'success' | 'delete' | 'error' });

  useFocusEffect(useCallback(() => { load(); }, []));

  const load = async () => {
    try {
      const u = await AsyncStorage.getItem('user');
      if (u) setCurrency(JSON.parse(u).currency || '₹');
      const res = await getTransactions();
      setTransactions(res.data);
      applyFilter(res.data, filterType, search);
    } catch { }
    finally { setLoading(false); }
  };

  const applyFilter = (data: any[], type: Filter, q: string) => {
    let r = type === 'all' ? data : data.filter(t => t.type === type);
    if (q.trim()) r = r.filter(t =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.category.toLowerCase().includes(q.toLowerCase())
    );
    setFiltered(r);
  };

  const handleSearch = (text: string) => { setSearch(text); applyFilter(transactions, filterType, text); };
  const handleFilter = (type: Filter) => { setFilterType(type); applyFilter(transactions, type, search); };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTransaction(deleteId);
      const updated = transactions.filter(t => t._id !== deleteId);
      setTransactions(updated);
      applyFilter(updated, filterType, search);
      setDeleteId(null);
      setToast({ visible: true, message: 'Transaction removed', type: 'delete' });
    } catch {
      setDeleteId(null);
      setToast({ visible: true, message: 'Failed to delete', type: 'error' });
    }
  };

  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={T.teal} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <TouchableOpacity style={styles.addBtn}
            onPress={() => router.push({ pathname: '/(tabs)/add', params: { type: 'expense' } })}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryPill, { borderColor: T.income + '40' }]}>
            <Text style={styles.summaryPillLabel}>In</Text>
            <Text style={[styles.summaryPillAmt, { color: T.income }]}>+{currency}{totalIncome.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryPill, { borderColor: T.expense + '40' }]}>
            <Text style={styles.summaryPillLabel}>Out</Text>
            <Text style={[styles.summaryPillAmt, { color: T.expense }]}>-{currency}{totalExpense.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryPill, { borderColor: T.border }]}>
            <Text style={styles.summaryPillLabel}>Net</Text>
            <Text style={[styles.summaryPillAmt, { color: totalIncome - totalExpense >= 0 ? T.income : T.expense }]}>
              {currency}{(totalIncome - totalExpense).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput style={styles.searchInput} placeholder="Search transactions..."
            placeholderTextColor={T.textMuted} value={search} onChangeText={handleSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['all', 'income', 'expense'] as Filter[]).map(f => (
            <TouchableOpacity key={f}
              style={[styles.filterBtn, filterType === f && {
                backgroundColor: f === 'income' ? T.incomeGlow : f === 'expense' ? T.expenseGlow : T.tealGlow,
                borderColor: f === 'income' ? T.income : f === 'expense' ? T.expense : T.teal,
              }]}
              onPress={() => handleFilter(f)}>
              <Text style={[styles.filterTxt, filterType === f && {
                color: f === 'income' ? T.income : f === 'expense' ? T.expense : T.teal,
              }]}>
                {f === 'all' ? 'All' : f === 'income' ? '↑ Income' : '↓ Expense'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySub}>Try a different filter or add a new one</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.txCard}
            onPress={() => router.push({ pathname: '/(tabs)/add', params: { type: item.type, editId: item._id } })}
            activeOpacity={0.7}>
            <View style={[styles.txIcon, { backgroundColor: item.type === 'income' ? T.incomeGlow : T.expenseGlow }]}>
              <Text style={styles.txIconText}>{CAT_ICONS[item.category] || (item.type === 'income' ? '↑' : '↓')}</Text>
            </View>
            <View style={styles.txMiddle}>
              <Text style={styles.txTitle}>{item.title}</Text>
              <Text style={styles.txMeta}>
                {item.category} · {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
              </Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmt, { color: item.type === 'income' ? T.income : T.expense }]}>
                {item.type === 'income' ? '+' : '-'}{currency}{item.amount.toLocaleString('en-IN')}
              </Text>
              {/* ✅ Opens custom modal instead of Alert */}
              <TouchableOpacity
                onPress={() => setDeleteId(item._id)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Custom delete modal */}
      <DeleteModal
        visible={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg },
  header: { backgroundColor: T.bgCard, paddingTop: 55, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: T.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.teal, justifyContent: 'center', alignItems: 'center', shadowColor: T.teal, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  addBtnText: { color: T.bg, fontSize: 20, fontWeight: '800', lineHeight: 24 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryPill: { flex: 1, backgroundColor: T.bgElevated, borderRadius: T.radius, padding: 10, borderWidth: 1 },
  summaryPillLabel: { fontSize: 10, color: T.textMuted, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  summaryPillAmt: { fontSize: 13, fontWeight: '800' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bgInput, borderRadius: T.radius, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: T.textPrimary },
  clearBtn: { color: T.textMuted, fontSize: 14, padding: 4 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: T.radiusSm, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bgElevated },
  filterTxt: { fontSize: 12, fontWeight: '700', color: T.textSecondary },
  listContent: { padding: 16, gap: 10, paddingBottom: 100 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bgCard, borderRadius: T.radius, padding: 14, borderWidth: 1, borderColor: T.border, gap: 12 },
  txIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txIconText: { fontSize: 22 },
  txMiddle: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '600', color: T.textPrimary, marginBottom: 3 },
  txMeta: { fontSize: 12, color: T.textSecondary },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmt: { fontSize: 15, fontWeight: '800' },
  deleteBtn: { padding: 2 },
  deleteIcon: { fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textSecondary, textAlign: 'center' },
});

// ── Delete Modal Styles ───────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  card: {
    backgroundColor: T.bgCard, borderRadius: T.radiusLg,
    padding: 28, width: 300, alignItems: 'center',
    borderWidth: 1, borderColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: T.expenseGlow, justifyContent: 'center',
    alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: T.expense + '40',
  },
  iconEmoji: { fontSize: 28 },
  title:    { fontSize: 18, fontWeight: '800', color: T.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 13, color: T.textSecondary, textAlign: 'center', marginBottom: 24 },
  btnRow:   { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: T.radius,
    alignItems: 'center', backgroundColor: T.bgElevated,
    borderWidth: 1, borderColor: T.border,
  },
  cancelText: { color: T.textSecondary, fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    flex: 1, paddingVertical: 14, borderRadius: T.radius,
    alignItems: 'center', backgroundColor: T.expenseGlow,
    borderWidth: 1, borderColor: T.expense + '60',
  },
  deleteText: { color: T.expense, fontWeight: '800', fontSize: 15 },
});