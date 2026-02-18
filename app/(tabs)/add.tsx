import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addTransaction, updateTransaction, getCategories } from '../../services/api';
import { T } from '../../constants/theme';

const DEFAULT_EXPENSE = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
const DEFAULT_INCOME  = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const CAT_ICONS: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍', Bills: '📄',
  Entertainment: '🎬', Health: '💊', Salary: '💼', Freelance: '💻',
  Investment: '📈', Gift: '🎁', Other: '📦',
};

export default function AddScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; editId?: string }>();
  const [type, setType]             = useState<'income' | 'expense'>((params.type as any) || 'expense');
  const [title, setTitle]           = useState('');
  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('');
  const [notes, setNotes]           = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [currency, setCurrency]     = useState('₹');
  const [autoTitle, setAutoTitle]   = useState(true);

  useEffect(() => { loadCurrency(); }, []);
  useEffect(() => { if (params.type) setType(params.type as any); }, [params.type]);
  useEffect(() => { loadCategories(); setCategory(''); if (autoTitle) setTitle(''); }, [type]);

  const loadCurrency = async () => {
    const u = await AsyncStorage.getItem('user');
    if (u) setCurrency(JSON.parse(u).currency || '₹');
  };

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      const filtered = res.data.filter((c: any) => c.type === type).map((c: any) => c.name);
      const unique = [...new Set(filtered)] as string[];
      setCategories(unique.length > 0 ? unique : (type === 'income' ? DEFAULT_INCOME : DEFAULT_EXPENSE));
    } catch {
      setCategories(type === 'income' ? DEFAULT_INCOME : DEFAULT_EXPENSE);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    if (autoTitle) setTitle(cat);
  };

  const handleSubmit = async () => {
    if (!title.trim())     return Alert.alert('Missing', 'Enter a title');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
                           return Alert.alert('Missing', 'Enter a valid amount');
    if (!category)         return Alert.alert('Missing', 'Select a category');
    setLoading(true);
    try {
      const data = { title: title.trim(), amount: Number(amount), type, category, notes: notes.trim() };
      if (params.editId) {
        await updateTransaction(params.editId, data);
        Alert.alert('✅ Updated', 'Transaction updated!');
      } else {
        await addTransaction(data);
        Alert.alert('✅ Saved', 'Transaction added!');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save');
    } finally { setLoading(false); }
  };

  const isIncome   = type === 'income';
  const accent     = isIncome ? T.income : T.expense;
  const accentGlow = isIncome ? T.incomeGlow : T.expenseGlow;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { borderBottomColor: accent + '40' }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{params.editId ? 'Edit' : 'New'} Transaction</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.typeWrap}>
            <TouchableOpacity
              style={[styles.typeBtn, !isIncome && { backgroundColor: T.expenseGlow, borderColor: T.expense }]}
              onPress={() => { setType('expense'); setAutoTitle(true); }}>
              <Text style={[styles.typeIcon, { color: !isIncome ? T.expense : T.textMuted }]}>↓</Text>
              <Text style={[styles.typeTxt, { color: !isIncome ? T.expense : T.textMuted }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, isIncome && { backgroundColor: T.incomeGlow, borderColor: T.income }]}
              onPress={() => { setType('income'); setAutoTitle(true); }}>
              <Text style={[styles.typeIcon, { color: isIncome ? T.income : T.textMuted }]}>↑</Text>
              <Text style={[styles.typeTxt, { color: isIncome ? T.income : T.textMuted }]}>Income</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.amountWrap, { borderColor: accent + '50' }]}>
            <Text style={styles.amtLabel}>AMOUNT</Text>
            <View style={styles.amtRow}>
              <Text style={[styles.amtCurrency, { color: accent }]}>{currency}</Text>
              <TextInput
                style={[styles.amtInput, { color: accent }]}
                placeholder="0.00"
                placeholderTextColor={T.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <View style={styles.catGrid}>
              {categories.map((cat, i) => (
                <TouchableOpacity
                  key={`${cat}-${i}`}
                  style={[styles.catChip, category === cat && { backgroundColor: accentGlow, borderColor: accent }]}
                  onPress={() => handleCategorySelect(cat)}>
                  <Text style={styles.catChipEmoji}>{CAT_ICONS[cat] || '📦'}</Text>
                  <Text style={[styles.catChipText, category === cat && { color: accent }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.sectionLabel}>TITLE</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Monthly Salary, Grocery run..."
              placeholderTextColor={T.textMuted}
              value={title}
              onChangeText={(t) => { setTitle(t); setAutoTitle(t === '' || t === category); }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES <Text style={styles.labelHint}>optional</Text></Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Any additional details..."
              placeholderTextColor={T.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: accent, shadowColor: accent }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={T.bg} />
              : <Text style={styles.submitText}>{params.editId ? '✓ Update Transaction' : '＋ Save Transaction'}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 22, color: T.textPrimary, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: T.textPrimary },
  typeWrap: { flexDirection: 'row', margin: 20, gap: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: T.radius, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bgCard },
  typeIcon: { fontSize: 20, fontWeight: '800' },
  typeTxt: { fontSize: 15, fontWeight: '700' },
  amountWrap: { marginHorizontal: 20, marginBottom: 20, backgroundColor: T.bgCard, borderRadius: T.radiusLg, padding: 22, borderWidth: 1.5 },
  amtLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  amtRow: { flexDirection: 'row', alignItems: 'center' },
  amtCurrency: { fontSize: 32, fontWeight: '800', marginRight: 6 },
  amtInput: { flex: 1, fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 1.5, marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  labelHint: { fontSize: 11, color: T.textMuted, fontWeight: '400' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bgCard },
  catChipEmoji: { fontSize: 15 },
  catChipText: { fontSize: 13, fontWeight: '600', color: T.textSecondary },
  input: { backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border, borderRadius: T.radius, padding: 14, fontSize: 15, color: T.textPrimary },
  notesInput: { height: 90, textAlignVertical: 'top' },
  submitBtn: { marginHorizontal: 20, marginTop: 8, paddingVertical: 17, borderRadius: T.radius, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  submitText: { color: T.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});