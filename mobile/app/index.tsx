import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { API_BASE, resolveMediaUrl } from '@/services/config';
import { apiFetch } from '@/services/auth';
import LiveNavigationMap, { type NearbyDestination } from '@/components/LiveNavigationMap';

const { width, height: screenHeight } = Dimensions.get('window');





const MAP_DESTINATIONS: NearbyDestination[] = [
  { id: 'sigiriya', name: 'Sigiriya', lat: 7.9570, lng: 80.7603, emoji: '🪨' },
  { id: 'kandy', name: 'Kandy', lat: 7.2906, lng: 80.6337, emoji: '⛩️' },
  { id: 'galle', name: 'Galle Fort', lat: 6.0300, lng: 80.2167, emoji: '🏰' },
  { id: 'ella', name: 'Ella', lat: 6.8667, lng: 81.0466, emoji: '🍵' },
  { id: 'yala', name: 'Yala National Park', lat: 6.3728, lng: 81.5165, emoji: '🐆' },
  { id: 'mirissa', name: 'Mirissa', lat: 5.9483, lng: 80.4589, emoji: '🌊' },
  { id: 'nuwara-eliya', name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891, emoji: '🍃' },
  { id: 'colombo', name: 'Colombo', lat: 6.9271, lng: 79.8612, emoji: '🏙️' },
];

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky ☀️';
  if (code <= 2) return 'Partly cloudy ⛅';
  if (code <= 48) return 'Foggy 🌫️';
  if (code <= 67) return 'Rainy 🌧️';
  if (code <= 77) return 'Snowy ❄️';
  if (code <= 82) return 'Showers 🌦️';
  if (code <= 99) return 'Thunderstorm ⛈️';
  return 'Unknown';
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function greetingFor(hour: number): string {
  if (hour < 5) return 'Good night 🌙';
  if (hour < 12) return 'Good morning 🌅';
  if (hour < 17) return 'Good afternoon 🌿';
  if (hour < 20) return 'Good evening 🌇';
  return 'Good night 🌙';
}

const QUICK_ACTIONS = [
  { label: 'Find Tours', icon: '🏔️', route: '/tours', color: Colors.brand },
  { label: 'Hotels', icon: '🏨', route: '/hotels', color: Colors.brandMid },
  { label: 'Ask AI', icon: '✨', route: '/chat', color: Colors.brandAccent },
] as const;

const TIPS_BY_HOUR: Record<number, string[]> = {
  5: ['🌅 Sunrise at Sigiriya is magical — the mist clears by 7am', "Perfect time for Adam's Peak descent if you climbed overnight"],
  8: ['☕ Try a hoppers breakfast at a local kade (café)', 'Morning is best for wildlife drives at Yala or Wilpattu'],
  12: ['🌡️ Midday heat peaks — ideal for a temple visit or cave exploration', 'Try a rice & curry lunch plate at a local restaurant'],
  15: ['🍵 Ceylon tea tasting in the hill country is best in the afternoon', 'Markets start getting lively — explore a local pola (street market)'],
  17: ['🌅 Sunset from Galle Fort ramparts is unmissable', 'Head to a beach for sunset — Mirissa, Unawatuna, or Hikkaduwa'],
  20: ['🦟 Apply repellent for evening mosquitoes, especially near water', 'Evening train journeys are peaceful — Colombo to Galle by night'],
  23: ["💤 Rest well — Sri Lanka's beauty is best experienced fresh in the morning", 'Kandy Perahera processions often run late into the night'],
};

function getTipsForHour(hour: number): string[] {
  const keys = Object.keys(TIPS_BY_HOUR).map(Number).sort((a, b) => a - b);
  for (let i = keys.length - 1; i >= 0; i--) {
    if (hour >= keys[i]) return TIPS_BY_HOUR[keys[i]];
  }
  return TIPS_BY_HOUR[5];
}

const HIGHLIGHTS = [
  { emoji: '🪨', name: 'Sigiriya', sub: 'Ancient rock fortress' },
  { emoji: '🐆', name: 'Yala', sub: 'Leopard safari' },
  { emoji: '🌊', name: 'Mirissa', sub: 'Whale watching' },
  { emoji: '🍵', name: 'Ella', sub: 'Tea & mountains' },
  { emoji: '🕌', name: 'Galle', sub: 'Dutch colonial fort' },
  { emoji: '🐘', name: 'Pinnawala', sub: 'Elephant orphanage' },
  { emoji: '⛩️', name: 'Kandy', sub: 'Temple of Tooth' },
  { emoji: '🏖️', name: 'Trincomalee', sub: 'East coast beaches' },
];

export default function DailyModeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current=temperature_2m,weather_code&timezone=Asia%2FColombo'
      );
      const d = await res.json();
      setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code });
    } catch (_) {}
  }, []);

  const fetchAiTips = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE}/ai/daily-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour: new Date().getHours(), weatherCode: weather?.code, destinationName: 'Colombo' }),
      });
      const d = await res.json();
      if (Array.isArray(d.tips) && d.tips.length > 0) setAiTips(d.tips);
    } catch (_) {}
  }, [weather]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  useEffect(() => { if (weather !== null) fetchAiTips(); }, [weather, fetchAiTips]);

  const hour = now.getHours();
  const localTips = getTipsForHour(hour);
  const activeTips = aiTips.length > 0 ? aiTips : localTips;

  useEffect(() => {
    if (activeTips.length < 2) return;
    const t = setInterval(() => setCurrentTipIdx(i => (i + 1) % activeTips.length), 6000);
    return () => clearInterval(t);
  }, [hour, activeTips]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWeather();
    await fetchAiTips();
    setRefreshing(false);
  }, [fetchWeather, fetchAiTips]);

  const displayTip = activeTips[currentTipIdx % activeTips.length] || '';
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  
  
  const mapHeight = Math.round(screenHeight * 0.6);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {}
      <View style={{ position: isMapExpanded ? 'absolute' : 'relative', top: 0, left: 0, right: 0, zIndex: isMapExpanded ? 999 : 1, height: isMapExpanded ? screenHeight : mapHeight }}>
        <LiveNavigationMap
          height={isMapExpanded ? screenHeight : mapHeight}
          theme={theme}
          destinations={MAP_DESTINATIONS}
          isExpanded={isMapExpanded}
          onPressDestination={() => router.push('/tours' as any)}
          onExpand={() => setIsMapExpanded(!isMapExpanded)}
        />

        {}
        <SafeAreaView edges={['top']} style={styles.mapStatusSafe} pointerEvents="box-none">
          <View style={styles.mapStatusBar} pointerEvents="box-none">
            <View style={styles.mapStatusPill}>
              <Text style={styles.mapStatusAppName}>TourGenie</Text>
              <Text style={styles.mapStatusModeLabel}>Daily Mode · Live</Text>
            </View>
            {weather && (
              <View style={styles.mapStatusPill}>
                <Text style={styles.weatherEmojiSmall}>{weatherEmoji(weather.code)}</Text>
                <Text style={styles.mapStatusWeatherTemp}>{weather.temp}°C</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brandAccent} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.greetingStrip, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.greeting2, { color: theme.textSecondary }]}>{greetingFor(hour)}</Text>
          <Text style={[styles.clock2, { color: theme.text }]}>{timeStr}</Text>
          <Text style={[styles.date2, { color: theme.textSecondary }]}>{dateStr}{weather ? ` · Colombo · ${weatherLabel(weather.code)}` : ''}</Text>
        </View>

        <View style={[styles.body, { backgroundColor: theme.background }]}>
          <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.tipLabel, { color: Colors.brandAccent }]}>✨ Tip of the Moment</Text>
            <Text style={[styles.tipText, { color: theme.text }]}>{displayTip}</Text>
            {aiTips.length > 0 && <Text style={[styles.tipSource, { color: theme.textSecondary }]}>Powered by TourGenie AI</Text>}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(a => (
              <TouchableOpacity
                key={a.route}
                style={[styles.actionBtn, { backgroundColor: a.color }]}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.82}
              >
                <Text style={styles.actionIcon}>{a.icon}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Sri Lanka Journey</Text>
          <View style={[styles.journeyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <JourneyItem icon="🗺️" title="Explore the island" sub="Browse curated tours across Sri Lanka" onPress={() => router.push('/tours' as any)} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <JourneyItem icon="🏨" title="Find your stay" sub="Boutique hotels, villas, and resorts" onPress={() => router.push('/hotels' as any)} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <JourneyItem icon="🧭" title="Create your own tour" sub="AI-built itinerary for your route" onPress={() => router.push('/create-tour' as any)} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <JourneyItem icon="🧳" title="My Trips" sub="View your bookings & travel history" onPress={() => router.push('/trips' as any)} theme={theme} />
          </View>

          {aiTips.length > 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Travel Tips</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
                {aiTips.map((tip, i) => (
                  <View key={i} style={[styles.tipChip, { backgroundColor: theme.backgroundElement }]}>
                    <Text style={[styles.tipChipText, { color: theme.text }]}>{tip}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Must-See Highlights</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.highlightsScroll}>
            {HIGHLIGHTS.map(h => (
              <View key={h.name} style={[styles.highlightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={styles.highlightEmoji}>{h.emoji}</Text>
                <Text style={[styles.highlightName, { color: theme.text }]}>{h.name}</Text>
                <Text style={[styles.highlightSub, { color: theme.textSecondary }]}>{h.sub}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function JourneyItem({ icon, title, sub, onPress, theme }: { icon: string; title: string; sub: string; onPress: () => void; theme: typeof Colors.light | typeof Colors.dark }) {
  return (
    <TouchableOpacity style={styles.journeyItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.journeyIcon}>{icon}</Text>
      <View style={styles.journeyText}>
        <Text style={[styles.journeyTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.journeySub, { color: theme.textSecondary }]}>{sub}</Text>
      </View>
      <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  
  mapStatusSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  mapStatusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 10 },
  mapStatusPill: {
    backgroundColor: 'rgba(20,32,29,0.72)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  mapStatusAppName: { color: '#fff', fontSize: 13, fontWeight: '800' },
  mapStatusModeLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '500', marginLeft: 6 },
  weatherEmojiSmall: { fontSize: 14 },
  mapStatusWeatherTemp: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  greetingStrip: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, borderBottomWidth: 0 },
  greeting2: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  clock2: { fontSize: 34, fontWeight: '200', letterSpacing: -0.5, lineHeight: 40 },
  date2: { fontSize: 12, marginTop: 2 },
  body: { paddingHorizontal: 16, paddingTop: 20 },
  tipCard: { borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1 },
  tipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  tipText: { fontSize: 15, lineHeight: 22 },
  tipSource: { fontSize: 11, marginTop: 8, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  actionBtn: { width: (width - 42) / 2, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'flex-start' },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  journeyCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 28 },
  journeyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  journeyIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  journeyText: { flex: 1 },
  journeyTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  journeySub: { fontSize: 13 },
  chevron: { fontSize: 22 },
  divider: { height: 1, marginLeft: 64 },
  tipsScroll: { marginBottom: 28 },
  tipChip: { borderRadius: 12, padding: 14, marginRight: 10, maxWidth: width * 0.75 },
  tipChipText: { fontSize: 13, lineHeight: 20 },
  highlightsScroll: { marginBottom: 12 },
  highlightCard: { borderRadius: 14, padding: 16, marginRight: 12, width: 130, borderWidth: 1, alignItems: 'center' },
  highlightEmoji: { fontSize: 32, marginBottom: 8 },
  highlightName: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  highlightSub: { fontSize: 12, textAlign: 'center', marginTop: 2 },
});
