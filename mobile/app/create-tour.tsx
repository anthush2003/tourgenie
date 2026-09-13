import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { API_BASE } from '@/services/config';
import { apiFetch } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

const INTERESTS = ['Culture', 'Nature', 'Beach', 'Wildlife', 'Food', 'Adventure', 'Relaxation'];
const TRANSPORT_MODES = [
  { key: 'driving', label: '🚗 Driving' },
  { key: 'cycling', label: '🚴 Cycling' },
  { key: 'walking', label: '🚶 Walking' },
] as const;

export default function CreateTourScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { isAuthenticated } = useAuth();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [transportMode, setTransportMode] = useState<typeof TRANSPORT_MODES[number]['key']>('driving');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set(['Culture']));
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (i: string) => {
    setSelectedInterests(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const generate = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please sign in to generate AI itineraries.');
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      setError('Please enter both a starting point and a destination.');
      return;
    }
    const numDays = parseInt(days);
    if (!numDays || numDays < 1) {
      setError('Trip length must be at least 1 day.');
      return;
    }
    setError(null);
    setLoading(true);
    setItinerary(null);

    const prompt = `Create a custom ${numDays}-day Sri Lanka tour itinerary from ${origin} to ${destination} by ${transportMode}. Focus on these interests: ${Array.from(selectedInterests).join(', ') || 'general sightseeing'}. Give a day-by-day plan with stops, activities, and rough timing.`;

    try {
      const res = await apiFetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],







          context: { page: 'create-tour', sessionId: `create_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` },
        }),
      });
      const data = await res.json();
      setItinerary(data.reply || "Ayubowan! 🌿 I couldn't build that itinerary just now — please try again.");
    } catch (_) {
      setError('Could not reach TourGenie AI. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, days, transportMode, selectedInterests]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Create Your Own Tour</Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              Tell TourGenie AI where you're headed and it'll build your route
            </Text>
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={[styles.label, { color: theme.text }]}>Starting point</Text>
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            placeholder="e.g. Colombo"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Destination</Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Ella"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Trip length (days)</Text>
          <TextInput
            value={days}
            onChangeText={t => setDays(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, width: 100 }]}
          />

          <Text style={[styles.label, { color: theme.text }]}>Transport</Text>
          <View style={styles.chipRow}>
            {TRANSPORT_MODES.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.chip, { backgroundColor: transportMode === m.key ? Colors.brand : theme.backgroundElement }]}
                onPress={() => setTransportMode(m.key)}
              >
                <Text style={{ color: transportMode === m.key ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text }]}>Interests</Text>
          <View style={styles.chipRow}>
            {INTERESTS.map(i => {
              const active = selectedInterests.has(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, { backgroundColor: active ? Colors.brandAccent : theme.backgroundElement }]}
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600', fontSize: 13 }}>{i}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error && <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>}

          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: Colors.brand, opacity: loading ? 0.7 : 1 }]}
            onPress={generate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateBtnText}>✨ Generate Itinerary with AI</Text>}
          </TouchableOpacity>

          {itinerary && (
            <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.resultLabel, { color: Colors.brandAccent }]}>Your AI-Generated Itinerary</Text>
              <Text style={[styles.resultText, { color: theme.text }]}>{itinerary}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  errorText: { fontSize: 13, marginTop: 16 },
  generateBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 20 },
  resultLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  resultText: { fontSize: 14, lineHeight: 22 },
});
