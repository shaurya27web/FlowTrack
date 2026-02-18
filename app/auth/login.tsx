import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { login, register } from '../../services/api';
import { T } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const saveAndRedirect = async (token: string, user: any) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    router.replace('/(tabs)/');
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim()))
      return Alert.alert('Missing Fields', 'Please fill in all fields');
    if (password.length < 6)
      return Alert.alert('Weak Password', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      const response = isLogin
        ? await login({ email: email.trim().toLowerCase(), password })
        : await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
      if (response.data.success) await saveAndRedirect(response.data.token, response.data.user);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string) => [styles.input, focusedField === field && styles.inputFocused];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.logoArea}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Text style={styles.logoSymbol}>₹</Text>
            </View>
          </View>
          <Text style={styles.appName}>FlowTrack</Text>
          <Text style={styles.tagline}>Your money, clearly.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => { setIsLogin(true); setName(''); }}>
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => setIsLogin(false)}>
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput style={inputStyle('name')} placeholder="John Doe" placeholderTextColor={T.textMuted}
                value={name} onChangeText={setName} autoCapitalize="words"
                onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField('')} />
            </View>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput style={inputStyle('email')} placeholder="you@example.com" placeholderTextColor={T.textMuted}
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')} />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={inputStyle('password')} placeholder="••••••••" placeholderTextColor={T.textMuted}
              value={password} onChangeText={setPassword} secureTextEntry
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')} />
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={T.bg} /> : <Text style={styles.btnText}>{isLogin ? 'Sign In →' : 'Create Account →'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setName(''); }} style={styles.switchWrap}>
            <Text style={styles.switchText}>
              {isLogin ? "No account? " : "Have an account? "}
              <Text style={styles.switchLink}>{isLogin ? 'Register' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(0,212,180,0.07)', top: -80, right: -80 },
  circle2: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(245,200,66,0.05)', top: 100, left: -70 },
  logoArea: { alignItems: 'center', paddingTop: 90, paddingBottom: 44 },
  logoRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: T.teal, justifyContent: 'center', alignItems: 'center', marginBottom: 18, shadowColor: T.teal, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  logoInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: T.tealGlow, justifyContent: 'center', alignItems: 'center' },
  logoSymbol: { fontSize: 28, color: T.teal, fontWeight: '900' },
  appName: { fontSize: 30, fontWeight: '800', color: T.textPrimary, letterSpacing: 2 },
  tagline: { fontSize: 13, color: T.textSecondary, marginTop: 8, letterSpacing: 1 },
  card: { backgroundColor: T.bgCard, marginHorizontal: 20, borderRadius: T.radiusLg, padding: 24, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  tabRow: { flexDirection: 'row', backgroundColor: T.bg, borderRadius: T.radius, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 12 },
  tabActive: { backgroundColor: T.teal },
  tabText: { fontSize: 14, fontWeight: '700', color: T.textSecondary },
  tabTextActive: { color: T.bg },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: T.textMuted, marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: T.bgInput, borderWidth: 1, borderColor: T.border, borderRadius: T.radius, padding: 14, fontSize: 15, color: T.textPrimary },
  inputFocused: { borderColor: T.teal, shadowColor: T.teal, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  btn: { backgroundColor: T.teal, padding: 16, borderRadius: T.radius, alignItems: 'center', marginTop: 8, shadowColor: T.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btnText: { color: T.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  switchWrap: { marginTop: 20, alignItems: 'center' },
  switchText: { color: T.textSecondary, fontSize: 14 },
  switchLink: { color: T.teal, fontWeight: '700' },
});