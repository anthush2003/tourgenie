

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, Dimensions, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

type SettingsItem = { icon: string; label: string; type: string; key?: string; route?: string; value?: string; };
const SETTINGS_ITEMS: SettingsItem[] = [
  { icon: '🔔', label: 'Push Notifications', type: 'toggle', key: 'notifications' },
  { icon: '🔒', label: 'Privacy Policy', type: 'nav', route: '/privacy' },
  { icon: '📄', label: 'Terms of Service', type: 'nav', route: '/terms' },
  { icon: '❓', label: 'Help & Support', type: 'nav' },
];

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();




  const { user, isAuthenticated, loading: authLoading, login, register, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const submitAuth = async () => {
    setAuthError(null);
    if (!email.trim() || !password.trim() || (authMode === 'register' && !name.trim())) {
      setAuthError('Please fill in all fields.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    
    if (authMode === 'register' && password.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    setSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (authLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.root, { backgroundColor: theme.background }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
            </View>
          </SafeAreaView>
          <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <View style={styles.loginHero}>
                  <Text style={styles.loginEmoji}>🌿</Text>
                  <Text style={[styles.loginTitle, { color: theme.text }]}>Welcome to TourGenie</Text>
                  <Text style={[styles.loginSub, { color: theme.textSecondary }]}>
                    {authMode === 'login' ? 'Sign in to manage your bookings, save favourite destinations, and get personalised recommendations.' : 'Create an account to start booking tours, vehicles, and hotels.'}
                  </Text>

                  {authMode === 'register' && (
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Full name"
                      placeholderTextColor={theme.textSecondary}
                      style={[styles.authInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                    />
                  )}
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={[styles.authInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                  />
                  <View style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Password"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      style={[styles.authInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, marginBottom: 0, paddingRight: 40 }]}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: 14 }}
                    >
                      <Text style={{ fontSize: 16 }}>{showPassword ? '🫣' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>

                  {authError && <Text style={[styles.authErrorText, { color: Colors.error }]}>{authError}</Text>}

                  <TouchableOpacity
                    style={[styles.loginBtn, { backgroundColor: Colors.brand, opacity: submitting ? 0.7 : 1 }]}
                    onPress={submitAuth}
                    disabled={submitting}
                  >
                    {submitting ? <ActivityIndicator color="#fff" /> : (
                      <Text style={styles.loginBtnText}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.guestLink}
                    onPress={() => { setAuthMode(m => m === 'login' ? 'register' : 'login'); setAuthError(null); }}
                  >
                    <Text style={[styles.guestLinkText, { color: theme.textSecondary }]}>
                      {authMode === 'login' ? "Don't have an account? Create one →" : 'Already have an account? Sign in →'}
                    </Text>
                  </TouchableOpacity>
                </View>

                { }
                <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.infoTitle, { color: theme.text }]}>About TourGenie</Text>
                  <Text style={[styles.infoText, { color: theme.textSecondary }]}>Your AI-powered Sri Lanka travel companion. Discover tours, find hotels, navigate daily mode, and chat with our Gemini-powered AI guide.</Text>
                  <Text style={[styles.infoVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={{ color: Colors.brandAccent, fontSize: 14, fontWeight: '600' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        { }
        <View style={[styles.avatarCard, { backgroundColor: Colors.brand }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🌿</Text>
          </View>
          <Text style={styles.avatarName}>{user?.name || 'Traveller'}</Text>
          <Text style={styles.avatarEmail}>{user?.email || ''}</Text>
        </View>

        { }
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={styles.quickLinksRow}>
            <TouchableOpacity style={[styles.quickLink, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/trips' as any)}>
              <Text style={styles.quickLinkIcon}>🧳</Text>
              <Text style={[styles.quickLinkLabel, { color: theme.text }]}>My Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickLink, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/create-tour' as any)}>
              <Text style={styles.quickLinkIcon}>🧭</Text>
              <Text style={[styles.quickLinkLabel, { color: theme.text }]}>Create Tour</Text>
            </TouchableOpacity>

          </View>
        </View>

        { }
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <TouchableOpacity
            style={[styles.bookingCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
            onPress={() => router.push('/trips' as any)}
          >
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 2 }]}>My Bookings</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Tours, vehicles & hotel stays</Text>
            </View>
            <Text style={{ color: Colors.brandAccent, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </View>

        { }
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {SETTINGS_ITEMS.map((item, index) => (
              <View key={item.key || item.label}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  activeOpacity={item.type === 'nav' && item.route ? 0.6 : 1}
                  disabled={item.type === 'toggle' || !item.route}
                  onPress={() => {
                    if (item.type === 'nav' && item.route) {
                      router.push(item.route as any);
                    }
                  }}
                >
                  <Text style={styles.settingsIcon}>{item.icon}</Text>
                  <Text style={[styles.settingsLabel, { color: theme.text }]}>{item.label}</Text>
                  {item.type === 'toggle' ? (
                    <Switch
                      value={item.key === 'notifications' ? notifications : scheme === 'dark'}
                      onValueChange={(v) => {
                        if (item.key === 'notifications') setNotifications(v);
                      }}
                      trackColor={{ true: Colors.brand }}
                    />
                  ) : (
                    <View style={styles.settingsNav}>
                      {item.value && <Text style={[styles.settingsValue, { color: theme.textSecondary }]}>{item.value}</Text>}
                      <Text style={{ color: theme.textSecondary, fontSize: 18 }}>›</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {index < SETTINGS_ITEMS.length - 1 && <View style={[styles.settingsDivider, { backgroundColor: theme.border }]} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  loginHero: { alignItems: 'center', paddingVertical: 32 },
  loginEmoji: { fontSize: 64, marginBottom: 16 },
  loginTitle: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  loginSub: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 },
  loginBtn: { width: '100%', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerBtn: { width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 2, marginBottom: 20 },
  registerBtnText: { fontSize: 16, fontWeight: '700' },
  authInput: { width: '100%', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  authErrorText: { fontSize: 13, marginBottom: 12, textAlign: 'center' },
  guestLink: { paddingVertical: 12 },
  guestLinkText: { fontSize: 14 },
  infoCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginTop: 8 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  infoVersion: { fontSize: 12 },
  avatarCard: { paddingVertical: 32, alignItems: 'center', paddingBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 40 },
  avatarName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  avatarEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  quickLinksRow: { flexDirection: 'row', gap: 10 },
  quickLink: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 6 },
  quickLinkIcon: { fontSize: 22 },
  quickLinkLabel: { fontSize: 12, fontWeight: '600' },
  bookingCard: { borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1 },
  settingsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  settingsIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingsLabel: { flex: 1, fontSize: 15 },
  settingsNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingsValue: { fontSize: 14 },
  settingsDivider: { height: 1, marginLeft: 56 },
});
