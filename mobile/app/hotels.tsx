

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { API_BASE, resolveMediaUrl } from '@/services/config';
import { apiFetch } from '@/services/auth';
import { getCachedData, setCachedData } from '@/services/cache';

export default function HotelsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'stars'>('stars');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchHotels = async () => {
    try {
      const cached = await getCachedData<any[]>('hotels');
      if (cached) {
        setHotels(cached);
        setLoading(false);
      }
      
      const res = await apiFetch(`${API_BASE}/hotels`);
      if (!res.ok) throw new Error('Failed to load hotels');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHotels(data);
        await setCachedData('hotels', data);
      } else {
        if (!cached) setHotels([]);
      }
    } catch (err) {
      if (hotels.length === 0) {
        console.warn('Network error and no cache available', err);
        setHotels([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHotels(); }, []);

  const matchesRating = (hotel: any, minR: number) => {
    if (!minR) return true;
    const stars = hotel.starRating || hotel.rating || 0;
    return stars >= minR;
  };

  const matchesPrice = (hotel: any, maxP: number | null) => {
    if (maxP === null) return true;
    const price = hotel.pricePerNight || hotel.price || 0;
    if (price < 1000 && maxP >= 1000) {
      return price * 300 <= maxP;
    }
    return price <= maxP;
  };

  const filtered = hotels.filter(h => {
    if (!matchesRating(h, minRating)) return false;
    if (!matchesPrice(h, maxPrice)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'price'
      ? (a.pricePerNight || a.price || 0) - (b.pricePerNight || b.price || 0)
      : (b.starRating || b.rating || 0) - (a.starRating || a.rating || 0)
  );

  const activeFilterCount = (minRating > 0 ? 1 : 0) + (maxPrice !== null ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading hotels...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Hotels</Text>
              <TouchableOpacity
                style={[
                  styles.filterHeaderBtn,
                  {
                    backgroundColor: hasActiveFilters ? Colors.brand : theme.backgroundElement,
                    borderColor: hasActiveFilters ? Colors.brand : theme.border,
                  }
                ]}
                onPress={() => setModalVisible(true)}
              >
                <Text style={[styles.filterHeaderBtnText, { color: hasActiveFilters ? '#fff' : theme.text }]}>
                  🎛️ Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{sorted.length} places to stay</Text>
          </View>
          <View style={styles.sortRow}>
            <TouchableOpacity style={[styles.sortBtn, sortBy === 'stars' && styles.sortBtnActive]} onPress={() => setSortBy('stars')}>
              <Text style={[styles.sortBtnText, { color: sortBy === 'stars' ? '#fff' : theme.text }]}>★ Stars</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortBtn, sortBy === 'price' && styles.sortBtnActive]} onPress={() => setSortBy('price')}>
              <Text style={[styles.sortBtnText, { color: sortBy === 'price' ? '#fff' : theme.text }]}>LKR Price</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHotels(); }} tintColor={Colors.brand} />}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      >
        {error && (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📡</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Couldn't reach the server</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Pull down to try again.</Text>
          </View>
        )}
        {!error && sorted.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🏨</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No hotels match your filter</Text>
            <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Try adjusting your rating or price range.</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.brand, borderRadius: 16 }}
                onPress={() => {
                  setMinRating(0);
                  setMaxPrice(null);
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {sorted.map(hotel => (
          <HotelCard key={hotel._id || hotel.id} hotel={hotel} theme={theme} onPress={() => {
            router.push({ pathname: '/hotel-detail' as any, params: { id: hotel._id || hotel.id } });
          }} />
        ))}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filter Hotels</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Min Rating */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Minimum Rating</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Any', value: 0 },
                  { label: '3+ ★', value: 3 },
                  { label: '4+ ★', value: 4 },
                  { label: '5 ★', value: 5 },
                ].map(r => (
                  <TouchableOpacity
                    key={r.label}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: minRating === r.value ? Colors.brand : theme.backgroundElement,
                        borderColor: minRating === r.value ? Colors.brand : theme.border,
                      }
                    ]}
                    onPress={() => setMinRating(r.value)}
                  >
                    <Text style={[styles.modalChipText, { color: minRating === r.value ? '#fff' : theme.text }]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max Price */}
              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 20 }]}>Max Price (per night)</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Any', value: null },
                  { label: '< 35k', value: 35000 },
                  { label: '< 60k', value: 60000 },
                  { label: '< 100k', value: 100000 },
                  { label: '< 150k', value: 150000 },
                ].map(p => (
                  <TouchableOpacity
                    key={p.label}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: maxPrice === p.value ? Colors.brand : theme.backgroundElement,
                        borderColor: maxPrice === p.value ? Colors.brand : theme.border,
                      }
                    ]}
                    onPress={() => setMaxPrice(p.value)}
                  >
                    <Text style={[styles.modalChipText, { color: maxPrice === p.value ? '#fff' : theme.text }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              {hasActiveFilters && (
                <TouchableOpacity
                  style={[styles.resetBtn, { borderColor: theme.border }]}
                  onPress={() => {
                    setMinRating(0);
                    setMaxPrice(null);
                  }}
                >
                  <Text style={[styles.resetBtnText, { color: theme.textSecondary }]}>Reset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: Colors.brand }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.applyBtnText}>Show {sorted.length} Hotels</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HotelCard({ hotel, theme, onPress }: { hotel: any; theme: any; onPress: () => void }) {
  const stars = hotel.starRating || hotel.rating || 3;
  const price = hotel.pricePerNight || 0;
  const amenities = hotel.amenities || [];
  const photo = hotel.photos && hotel.photos.length > 0 ? resolveMediaUrl(hotel.photos[0]) : null;
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress}>
      <View style={styles.cardTop}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}><Text style={{ fontSize: 28 }}>🏨</Text></View>
        )}
        <View style={styles.cardInfo}>
          <Text style={[styles.hotelName, { color: theme.text }]} numberOfLines={1}>{hotel.name}</Text>
          <Text style={[styles.hotelLoc, { color: theme.textSecondary }]} numberOfLines={1}>📍 {hotel.location}</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: Math.max(0, Math.floor(stars)) }).map((_, i) => (
              <Text key={i} style={{ color: Colors.brandAccent, fontSize: 12 }}>★</Text>
            ))}
          </View>
        </View>
        <View>
          <Text style={[styles.price, { color: Colors.brand }]}>LKR {price.toLocaleString()}</Text>
          <Text style={[styles.perNight, { color: theme.textSecondary }]}>/ night</Text>
        </View>
      </View>
      {hotel.description && (
        <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>{hotel.description}</Text>
      )}
      {amenities.length > 0 && (
        <View style={styles.amenitiesRow}>
          {amenities.slice(0, 4).map((a: string) => (
            <View key={a} style={[styles.amenityChip, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.amenityText, { color: theme.textSecondary }]}>{a}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={[styles.bookBtn, { backgroundColor: Colors.brand }]}>
        <Text style={styles.bookBtnText}>View & Book →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  filterHeaderBtn: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  filterHeaderBtnText: { fontSize: 12, fontWeight: '600' },
  sortRow: { flexDirection: 'row', gap: 6 },
  sortBtn: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.brand },
  sortBtnActive: { backgroundColor: Colors.brand },
  sortBtnText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(43,77,54,0.1)' },
  cardInfo: { flex: 1 },
  hotelName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  hotelLoc: { fontSize: 12, marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2 },
  price: { fontSize: 20, fontWeight: '800', textAlign: 'right' },
  perNight: { fontSize: 11, textAlign: 'right' },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  amenityChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  amenityText: { fontSize: 11 },
  bookBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptyBody: { fontSize: 13 },
  modalOverlay: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { ...StyleSheet.absoluteFill },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%', borderWidth: 1, borderBottomWidth: 0 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  closeIcon: { fontSize: 18, fontWeight: '600', padding: 4 },
  modalScroll: { marginBottom: 16 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  modalChipText: { fontSize: 13, fontWeight: '600' },
  modalFooter: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(150,150,150,0.15)' },
  resetBtn: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetBtnText: { fontSize: 14, fontWeight: '600' },
  applyBtn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
