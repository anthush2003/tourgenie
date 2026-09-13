import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { API_BASE } from '@/services/config';
import { apiFetch } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

type Trip = {
  id: string;
  type: 'tour' | 'hotel';
  title: string;
  location: string;
  date: string;
  rawDate: string;
  status: 'confirmed' | 'cancelled';
  price: number;
  reference: string;
};

const STATUS_COLORS: Record<Trip['status'], string> = {
  confirmed: Colors.leaf500,
  cancelled: Colors.error,
};

export default function TripsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | Trip['status']>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const [hotelRes, tourRes] = await Promise.all([
        apiFetch(`${API_BASE}/bookings/user`),
        apiFetch(`${API_BASE}/tour-bookings/user`),
      ]);
      const hotelData = hotelRes.ok ? await hotelRes.json() : [];
      const tourData = tourRes.ok ? await tourRes.json() : [];

      const hotelTrips: Trip[] = (Array.isArray(hotelData) ? hotelData : []).map((b: any) => ({
        id: b.id || b._id,
        type: 'hotel',
        title: b.hotelName || 'Hotel Booking',
        location: b.hotelName || '',
        rawDate: b.checkInDate || '',
        date: b.checkInDate ? new Date(b.checkInDate + 'T12:00:00').toLocaleDateString() : '',
        status: b.status,
        price: b.totalPrice || 0,
        reference: b.dummyReference,
      }));
      const tourTrips: Trip[] = (Array.isArray(tourData) ? tourData : []).map((b: any) => ({
        id: b.id || b._id,
        type: 'tour',
        title: b.tourTitle || 'Tour Booking',
        location: b.vehicleName ? `Vehicle: ${b.vehicleName}` : '',
        rawDate: b.travelDate || '',
        date: b.travelDate ? new Date(b.travelDate + 'T12:00:00').toLocaleDateString() : '',
        status: b.status,
        price: b.totalPrice || 0,
        reference: b.dummyReference,
      }));

      setTrips([...tourTrips, ...hotelTrips].sort((a, b) => (a.rawDate < b.rawDate ? 1 : -1)));
    } catch {

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTrips([]);
    } else {
      load();
    }
  }, [load, isAuthenticated]);

  const cancelTrip = async (trip: Trip) => {
    Alert.alert('Cancel Booking', `Cancel your booking for "${trip.title}"?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => {
          setCancellingId(trip.id);
          try {
            const endpoint = trip.type === 'tour' ? `${API_BASE}/tour-bookings/${trip.id}/cancel` : `${API_BASE}/bookings/${trip.id}/cancel`;
            const res = await apiFetch(endpoint, { method: 'PUT' });
            if (!res.ok) throw new Error((await res.json()).message || 'Cancel failed');
            setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: 'cancelled' } : t));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not cancel booking.');
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: 20, textAlign: 'center' }]}>Sign in to see your trips</Text>
        <TouchableOpacity style={[styles.signInBtn, { backgroundColor: Colors.brand }]} onPress={() => router.push('/profile' as any)}>
          <Text style={styles.signInBtnText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Trips</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Your bookings and travel history</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {(['all', 'confirmed', 'cancelled'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, { backgroundColor: filter === f ? Colors.brand : theme.backgroundElement }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? '#fff' : theme.text }]}>
                {f[0].toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.brand} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🧳</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No trips in this category yet</Text>
            </View>
          ) : (
            filtered.map(trip => (
              <View key={trip.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardIcon}>{trip.type === 'tour' ? '🏔️' : '🏨'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{trip.title}</Text>
                    {!!trip.location && <Text style={[styles.cardLocation, { color: theme.textSecondary }]}>{trip.location}</Text>}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[trip.status] + '22' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[trip.status] }]}>{trip.status}</Text>
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.cardBottom}>
                  <Text style={[styles.cardDate, { color: theme.textSecondary }]}>{trip.date}</Text>
                  <Text style={[styles.cardRef, { color: theme.textSecondary }]}>{trip.reference}</Text>
                  <Text style={[styles.cardPrice, { color: theme.text }]}>LKR {trip.price.toLocaleString()}</Text>
                </View>
                {trip.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: Colors.error }]}
                    onPress={() => cancelTrip(trip)}
                    disabled={cancellingId === trip.id}
                  >
                    <Text style={[styles.cancelBtnText, { color: Colors.error }]}>
                      {cancellingId === trip.id ? 'Cancelling…' : 'Cancel Booking'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 4, marginBottom: 4 },
  filterScroll: { marginBottom: 12 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcon: { fontSize: 30 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardLocation: { fontSize: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  divider: { height: 1, marginVertical: 12 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 12 },
  cardRef: { fontSize: 11 },
  cardPrice: { fontSize: 15, fontWeight: '800' },
  cancelBtn: { marginTop: 12, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 12, fontWeight: '700' },
  signInBtn: { marginTop: 20, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  signInBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
