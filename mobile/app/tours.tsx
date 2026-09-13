import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { API_BASE } from '@/services/config';
import { apiFetch } from '@/services/auth';
import { getCachedData, setCachedData } from '@/services/cache';

const { width } = Dimensions.get('window');

const SEED_TOURS = [
  { _id: '1', title: 'Ancient Cities Triangle', duration: 5, price: 299, location: 'Cultural Triangle', description: 'Sigiriya, Dambulla, Anuradhapura — the heart of ancient Ceylon civilization.', category: 'Culture' },
  { _id: '2', title: 'Hill Country & Tea Trail', duration: 4, price: 249, location: 'Central Highlands', description: 'Kandy, Ella, and Nuwara Eliya through misty mountains and emerald tea estates.', category: 'Nature' },
  { _id: '3', title: 'Southern Beach Explorer', duration: 6, price: 349, location: 'South Coast', description: 'Galle, Mirissa, Tangalle — colonial history, whale watching, and pristine beaches.', category: 'Beach' },
  { _id: '4', title: 'Wildlife Safari Adventure', duration: 3, price: 399, location: 'Yala & Udawalawe', description: 'Leopards, elephants, and exotic birds across Sri Lanka\'s top wildlife parks.', category: 'Wildlife' },
  { _id: '5', title: 'East Coast Escape', duration: 5, price: 279, location: 'East Coast', description: 'Trincomalee, Arugam Bay, and Batticaloa — unspoiled beaches and azure water.', category: 'Beach' },
  { _id: '6', title: 'Colombo City & Culture', duration: 2, price: 149, location: 'Colombo', description: 'Colonial landmarks, street food, bustling markets, and Pettah bazaar.', category: 'Culture' },
];

const CATEGORY_ICONS: Record<string, string> = {
  Culture: '⛩️',
  Nature: '🌿',
  Beach: '🏖️',
  Wildlife: '🐆',
  Adventure: '⛰️',
};

export default function ToursScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchTours = async () => {
    try {
      const cached = await getCachedData<any[]>('tours');
      if (cached) {
        setTours(cached);
        setLoading(false);
      }
      
      const res = await apiFetch(`${API_BASE}/tours`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTours(data);
        await setCachedData('tours', data);
      }
    } catch (err) {
      if (tours.length === 0) {
        console.warn('Network error and no cache available', err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTours(); }, []);

  const matchesDuration = (tour: any, filter: string) => {
    if (filter === 'All') return true;
    const d = String(tour.duration || '').toLowerCase();
    const numDays = typeof tour.duration === 'number' ? tour.duration : null;

    if (filter === 'Half day') {
      if (numDays !== null) return numDays <= 0.5;
      return d.includes('half') || d.includes('4h') || d.includes('0.5');
    }
    if (filter === 'Full day') {
      if (numDays !== null) return numDays === 1;
      return d.includes('full') || d.includes('1 day') || d.includes('8h');
    }
    if (filter === 'Multi-day') {
      if (numDays !== null) return numDays > 1;
      if (d.includes('half') || d.includes('4h')) return false;
      if (d.includes('full') || d.includes('1 day') || d.includes('8h')) return false;
      const match = d.match(/(\d+)\s*days?/);
      if (match && parseInt(match[1], 10) >= 2) return true;
      return d.includes('multi') || d.includes('2 day') || d.includes('3 day') || d.includes('4 day') || d.includes('5 day') || d.includes('6 day');
    }
    return true;
  };

  const matchesPrice = (tour: any, maxP: number | null) => {
    if (maxP === null) return true;
    const price = tour.price || tour.pricePerPerson || 0;
    return price <= maxP;
  };

  const categories = ['All', ...Array.from(new Set(tours.map(t => t.category || t.region || 'Other').filter(Boolean)))];
  const filtered = tours.filter(t => {
    if (selectedCat !== 'All' && (t.category || t.region) !== selectedCat) return false;
    if (!matchesDuration(t, selectedDuration)) return false;
    if (!matchesPrice(t, maxPrice)) return false;
    return true;
  });

  const activeFilterCount = (selectedCat !== 'All' ? 1 : 0) + (selectedDuration !== 'All' ? 1 : 0) + (maxPrice !== null ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
        <Text style={[{ color: theme.textSecondary, marginTop: 12 }]}>Loading tours...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Tours</Text>
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
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{filtered.length} curated experiences</Text>
          </View>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: Colors.brand }]}
            onPress={() => router.push('/map' as any)}
          >
            <Text style={styles.createBtnText}>🗺️ Map</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, { backgroundColor: selectedCat === cat ? Colors.brand : theme.backgroundElement }]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.catChipText, { color: selectedCat === cat ? '#fff' : theme.text }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTours(); }} tintColor={Colors.brand} />}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
      >
        {filtered.map((tour, idx) => (
          <TourCard key={tour._id || tour.id || `tour-${idx}`} tour={tour} theme={theme} onPress={() => router.push({ pathname: '/tour-detail' as any, params: { id: tour._id || tour.id } })} />
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
            <Text style={[{ fontSize: 16, fontWeight: '600', color: theme.text }]}>No tours found</Text>
            {hasActiveFilters && (
              <TouchableOpacity
                style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.brand, borderRadius: 16 }}
                onPress={() => {
                  setSelectedCat('All');
                  setSelectedDuration('All');
                  setMaxPrice(null);
                }}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filter Tours</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Category */}
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Category</Text>
              <View style={styles.chipRow}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: selectedCat === cat ? Colors.brand : theme.backgroundElement,
                        borderColor: selectedCat === cat ? Colors.brand : theme.border,
                      }
                    ]}
                    onPress={() => setSelectedCat(cat)}
                  >
                    <Text style={[styles.modalChipText, { color: selectedCat === cat ? '#fff' : theme.text }]}>
                      {CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ${cat}` : cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 20 }]}>Duration</Text>
              <View style={styles.chipRow}>
                {['All', 'Half day', 'Full day', 'Multi-day'].map(dur => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.modalChip,
                      {
                        backgroundColor: selectedDuration === dur ? Colors.brand : theme.backgroundElement,
                        borderColor: selectedDuration === dur ? Colors.brand : theme.border,
                      }
                    ]}
                    onPress={() => setSelectedDuration(dur)}
                  >
                    <Text style={[styles.modalChipText, { color: selectedDuration === dur ? '#fff' : theme.text }]}>
                      {dur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max Price */}
              <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 20 }]}>Max Price</Text>
              <View style={styles.chipRow}>
                {[
                  { label: 'Any', value: null },
                  { label: '< 100k', value: 100000 },
                  { label: '< 200k', value: 200000 },
                  { label: '< 300k', value: 300000 },
                  { label: '< 500k', value: 500000 },
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
                    setSelectedCat('All');
                    setSelectedDuration('All');
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
                <Text style={styles.applyBtnText}>Show {filtered.length} Tours</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TourCard({ tour, theme, onPress }: { tour: any; theme: any; onPress?: () => void }) {
  const cat = tour.category || tour.region || 'Tour';
  const icon = CATEGORY_ICONS[cat] || '🗺️';
  const price = tour.price || tour.pricePerPerson || 0;
  return (
    <TouchableOpacity style={[styles.tourCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.tourCardTop}>
        <View style={[styles.tourIconBox, { backgroundColor: Colors.brand + '22' }]}>
          <Text style={styles.tourIcon}>{icon}</Text>
        </View>
        <View style={styles.tourInfo}>
          <Text style={[styles.tourTitle, { color: theme.text }]} numberOfLines={1}>{tour.title || tour.name}</Text>
          <Text style={[styles.tourLocation, { color: theme.textSecondary }]}>📍 {tour.location || tour.region || 'Sri Lanka'}</Text>
        </View>
        <View style={styles.tourPriceBox}>
          <Text style={[styles.tourPrice, { color: Colors.brand }]}>LKR {Number(price).toLocaleString()}</Text>
          <Text style={[styles.tourDur, { color: theme.textSecondary }]}>{tour.duration || 1}d</Text>
        </View>
      </View>
      <Text style={[styles.tourDesc, { color: theme.textSecondary }]} numberOfLines={2}>{tour.description}</Text>
      <View style={styles.tourFooter}>
        {tour.rating && <Text style={{ color: Colors.brandAccent }}>★ {tour.rating}</Text>}
        <View style={[styles.bookBtn, { backgroundColor: Colors.brand }]}>
          <Text style={styles.bookBtnText}>View Tour →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  filterHeaderBtn: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  filterHeaderBtnText: { fontSize: 12, fontWeight: '600' },
  createBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  catScroll: { marginBottom: 8 },
  catChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  catChipText: { fontSize: 13, fontWeight: '600' },
  tourCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  tourCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  tourIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tourIcon: { fontSize: 24 },
  tourInfo: { flex: 1 },
  tourTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  tourLocation: { fontSize: 12 },
  tourPriceBox: { alignItems: 'flex-end' },
  tourPrice: { fontSize: 18, fontWeight: '800' },
  tourDur: { fontSize: 12 },
  tourDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  tourFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
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
