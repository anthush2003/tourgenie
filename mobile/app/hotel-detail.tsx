

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { API_BASE, resolveMediaUrl } from '@/services/config';
import { apiFetch } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const ROOM_TYPES = [
  { type: 'standard' as const, label: 'Standard', multiplier: 1, maxGuests: 2 },
  { type: 'deluxe' as const, label: 'Deluxe', multiplier: 1.4, maxGuests: 4 },
  { type: 'suite' as const, label: 'Suite', multiplier: 2.1, maxGuests: 6 },
];

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function addDaysISO(dateISO: string, n: number): string {
  const d = new Date(dateISO + 'T12:00:00');
  d.setDate(d.getDate() + n);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function nightsBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T12:00:00');
  const d2 = new Date(b + 'T12:00:00');
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
}

export default function HotelDetailScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [hotel, setHotel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 2));
  const [roomType, setRoomType] = useState<'standard' | 'deluxe' | 'suite'>('standard');
  const [guests, setGuests] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/hotels/${params.id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setHotel(data);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const selectedRoom = ROOM_TYPES.find(r => r.type === roomType) || ROOM_TYPES[0];
  const nights = nightsBetween(checkIn, checkOut);
  const totalPrice = hotel ? Math.round(hotel.pricePerNight * nights * selectedRoom.multiplier) : 0;

  const changeCheckIn = (value: string) => {
    setCheckIn(value);
    if (value >= checkOut) setCheckOut(addDaysISO(value, 1));
  };

  const changeRoomType = (type: 'standard' | 'deluxe' | 'suite') => {
    setRoomType(type);
    const limit = ROOM_TYPES.find(r => r.type === type)?.maxGuests || 2;
    if (guests > limit) {
      setGuests(limit);
      Alert.alert('Guest Limit Adjusted', `The ${type} room allows a maximum of ${limit} guests.`);
    }
  };

  const submitBooking = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to book this hotel.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/profile' as any) },
      ]);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel._id || hotel.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          roomType,
          guests,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      setConfirmed(data);
    } catch (err) {
      Alert.alert('Booking Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  if (loadError || !hotel) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>Hotel not found</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
          This hotel may have been removed, or the connection failed.
        </Text>
        <TouchableOpacity style={[styles.bookBtn, { backgroundColor: Colors.brand, paddingHorizontal: 24 }]} onPress={() => router.back()}>
          <Text style={styles.bookBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photo = hotel.photos && hotel.photos.length > 0 ? resolveMediaUrl(hotel.photos[0]) : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 48 }}>🏨</Text>
          </View>
        )}
        <SafeAreaView edges={['top']} style={styles.backBtnSafe}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View style={{ padding: 16 }}>
          <Text style={[styles.title, { color: theme.text }]}>{hotel.name}</Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>📍 {hotel.location}</Text>
          {hotel.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>{hotel.description}</Text>
          )}

          {hotel.amenities && hotel.amenities.length > 0 && (
            <View style={styles.amenitiesRow}>
              {hotel.amenities.map((a: string) => (
                <View key={a} style={[styles.amenityChip, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.amenityText, { color: theme.textSecondary }]}>{a}</Text>
                </View>
              ))}
            </View>
          )}

          {(hotel.contactInfo?.phone || hotel.contactInfo?.email) && (
            <View style={[styles.contactBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {hotel.contactInfo.phone && <Text style={{ color: theme.textSecondary, fontSize: 12 }}>📞 {hotel.contactInfo.phone}</Text>}
              {hotel.contactInfo.email && <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>✉️ {hotel.contactInfo.email}</Text>}
            </View>
          )}

          { }
          {!confirmed ? (
            <View style={[styles.bookingPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, marginBottom: 12 }}>Book Your Stay</Text>

              <Text style={[styles.label, { color: theme.textSecondary }]}>Check-in</Text>
              <View style={styles.dateRow}>
                {[0, 1, 2, 3].map(offset => {
                  const dateVal = addDaysISO(todayISO(), offset);
                  const active = checkIn === dateVal;
                  return (
                    <TouchableOpacity key={dateVal}
                      style={[styles.dateChip, { borderColor: theme.border }, active && { backgroundColor: Colors.brand, borderColor: Colors.brand }]}
                      onPress={() => changeCheckIn(dateVal)}>
                      <Text style={{ color: active ? '#fff' : theme.text, fontSize: 12, fontWeight: '600' }}>
                        {offset === 0 ? 'Today' : dateVal.slice(5)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12 }]}>Nights</Text>
              <View style={[styles.dateRow, { alignItems: 'center' }]}>
                <TouchableOpacity style={[styles.guestChip, { borderColor: theme.border }]} onPress={() => setCheckOut(addDaysISO(checkIn, Math.max(1, nights - 1)))}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>-</Text>
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', marginHorizontal: 8 }}>{nights}</Text>
                <TouchableOpacity style={[styles.guestChip, { borderColor: theme.border }]} onPress={() => setCheckOut(addDaysISO(checkIn, Math.min(30, nights + 1)))}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12 }]}>Room Type</Text>
              <View style={styles.dateRow}>
                {ROOM_TYPES.map(r => {
                  const active = roomType === r.type;
                  return (
                    <TouchableOpacity key={r.type}
                      style={[styles.roomChip, { borderColor: theme.border }, active && { backgroundColor: Colors.brand, borderColor: Colors.brand }]}
                      onPress={() => changeRoomType(r.type)}>
                      <Text style={{ color: active ? '#fff' : theme.text, fontSize: 12, fontWeight: '700' }}>{r.label}</Text>
                      <Text style={{ color: active ? 'rgba(255,255,255,0.85)' : theme.textSecondary, fontSize: 10, marginTop: 1 }}>
                        LKR {Math.round(hotel.pricePerNight * r.multiplier).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: theme.textSecondary, marginTop: 12 }]}>Guests (max {selectedRoom.maxGuests})</Text>
              <View style={styles.dateRow}>
                {Array.from({ length: selectedRoom.maxGuests }, (_, i) => i + 1).map(n => {
                  const active = guests === n;
                  return (
                    <TouchableOpacity key={n}
                      style={[styles.guestChip, { borderColor: theme.border }, active && { backgroundColor: Colors.brand, borderColor: Colors.brand }]}
                      onPress={() => setGuests(n)}>
                      <Text style={{ color: active ? '#fff' : theme.text, fontSize: 13, fontWeight: '700' }}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.summaryBox, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.summaryRow}>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{checkIn} → {checkOut} · {nights} night{nights > 1 ? 's' : ''}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Total</Text>
                  <Text style={{ color: Colors.brand, fontWeight: '800', fontSize: 18 }}>LKR {totalPrice.toLocaleString()}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: Colors.brand, marginTop: 14 }, submitting && { opacity: 0.6 }]}
                onPress={submitBooking}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.bookBtnText}>{isAuthenticated ? 'Reserve Now' : 'Sign In to Book'}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.bookingPanel, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Booking Confirmed!</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 12 }}>
                {confirmed.checkInDate?.slice(0, 10)} → {confirmed.checkOutDate?.slice(0, 10)} · {confirmed.roomType}
              </Text>
              <View style={[styles.refBox, { backgroundColor: theme.backgroundElement }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Reference</Text>
                <Text style={{ color: Colors.brand, fontWeight: '800', fontSize: 18, fontFamily: 'monospace' }}>{confirmed.dummyReference}</Text>
              </View>
              <TouchableOpacity style={[styles.bookBtn, { backgroundColor: Colors.brand, marginTop: 14, paddingHorizontal: 28 }]} onPress={() => router.push('/trips' as any)}>
                <Text style={styles.bookBtnText}>View My Trips</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  coverImage: { width, height: 240 },
  backBtnSafe: { position: 'absolute', top: 0, left: 0 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginTop: 8 },
  backBtnText: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: -2 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  location: { fontSize: 13, marginBottom: 10 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  amenityChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  amenityText: { fontSize: 11, fontWeight: '600' },
  contactBox: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  bookingPanel: { borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 4 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  roomChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flex: 1, alignItems: 'center' },
  guestChip: { borderWidth: 1, borderRadius: 20, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  summaryBox: { borderRadius: 14, padding: 12, marginTop: 16, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  refBox: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
});
