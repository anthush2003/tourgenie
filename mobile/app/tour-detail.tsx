





import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, Alert, Dimensions, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { API_BASE } from '@/services/config';
import { apiFetch } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

const VEHICLE_ICON: Record<string, string> = {
  car: '🚗', van: '🚐', suv: '🚙', minibus: '🚌', bus: '🚍', tuktuk: '🛺', motorbike: '🏍️',
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 * 1000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const TOUR_START_HOUR = 9;
function formatArrivalTime(offsetMinutes = 0): string {
  const totalMinutes = TOUR_START_HOUR * 60 + offsetMinutes;
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
function formatDurationLabel(minutes = 0): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function TourDetailScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [tour, setTour] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [wantsVehicle, setWantsVehicle] = useState(true);
  const [guides, setGuides] = useState<any[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [wantsGuide, setWantsGuide] = useState(false);
  const [travelers, setTravelers] = useState(2);
  const [travelDate, setTravelDate] = useState('');
  const [travelDateError, setTravelDateError] = useState('');
  const [booking, setBooking] = useState(false);
  const [showBookingPanel, setShowBookingPanel] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeStopIdx, setActiveStopIdx] = useState(0);
  const [completedStops, setCompletedStops] = useState<Set<number>>(new Set());
  const [arrivedStopIdx, setArrivedStopIdx] = useState<number | null>(null);
  const [inRadiusCount, setInRadiusCount] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const watchSub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/tours/${params.id}`);
        const data = await res.json();
        setTour(data);
      } catch {
        Alert.alert('Error', 'Could not load this tour.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const loadVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vehicles`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch {
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  const loadGuides = useCallback(async () => {
    setGuidesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/guides`);
      const data = await res.json();
      setGuides(Array.isArray(data) ? data : []);
    } catch {
      setGuides([]);
    } finally {
      setGuidesLoading(false);
    }
  }, []);

  const openBookingPanel = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to book this tour.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/profile' as any) },
      ]);
      return;
    }
    setShowBookingPanel(true);
    if (vehicles.length === 0) loadVehicles();
    if (guides.length === 0) loadGuides();
  };

  const suitableVehicles = vehicles.filter(v => v.isActive && v.capacity >= travelers);
  const selectedVehicle = vehicles.find(v => (v.id || v._id) === selectedVehicleId) || null;
  const activeGuides = guides.filter(g => g.isActive);
  const selectedGuide = guides.find(g => (g.id || g._id) === selectedGuideId) || null;
  const tourPrice = tour?.price || 0;
  const durationMatch = tour?.duration ? String(tour.duration).match(/(\d+)\s*Days?/i) : null;
  const tourDays = durationMatch ? parseInt(durationMatch[1], 10) : 1;
  const vehicleTotal = wantsVehicle ? (selectedVehicle?.pricePerDay || 0) * tourDays : 0;
  const guideTotal = wantsGuide ? (selectedGuide?.pricePerDay || 0) * tourDays : 0;
  const estimatedTotal = tourPrice + vehicleTotal + guideTotal;

  const confirmBooking = async () => {
    if (wantsVehicle && !selectedVehicleId) {
      Alert.alert('Select a Vehicle', 'Please choose a vehicle, or switch to self-drive.');
      return;
    }
    if (wantsGuide && !selectedGuideId) {
      Alert.alert('Select a Guide', 'Please choose a guide, or skip the guide add-on.');
      return;
    }
    const parsedDate = new Date(travelDate);
    if (!travelDate || isNaN(parsedDate.getTime())) {
      setTravelDateError('Please enter a valid travel date (YYYY-MM-DD).');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate.getTime() < today.getTime()) {
      setTravelDateError('Travel date cannot be in the past.');
      return;
    }
    setTravelDateError('');
    setBooking(true);
    try {
      const res = await apiFetch(`${API_BASE}/tour-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id || tour._id,
          vehicleId: wantsVehicle ? selectedVehicleId : null,
          guideId: wantsGuide ? selectedGuideId : null,
          travelDate: parsedDate.toISOString(),
          travelers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      Alert.alert('Booking Confirmed! 🎉', `Reference: ${data.dummyReference}`, [
        { text: 'View My Trips', onPress: () => router.push('/trips' as any) },
        { text: 'OK', style: 'cancel' },
      ]);
      setShowBookingPanel(false);
    } catch (err) {
      Alert.alert('Booking Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const stops = tour?.stops || [];

  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        Alert.alert('Location Permission Needed', 'Enable location access to auto-detect arrivals at each stop.');
        return;
      }
      setPermissionDenied(false);
      setTracking(true);
      setActiveStopIdx(0);
      setCompletedStops(new Set());
      setArrivedStopIdx(null);
      watchSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
        (loc) => {
          setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      );
    } catch {
      Alert.alert('Location Error', 'Could not start live tracking. Please try again.');
    }
  }, []);

  const stopTracking = useCallback(() => {
    watchSub.current?.remove();
    watchSub.current = null;
    setTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      watchSub.current?.remove();
      watchSub.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tracking || !userLoc || stops.length === 0) return;
    const stop = stops[activeStopIdx];
    if (!stop) return;
    const dist = haversine(userLoc.latitude, userLoc.longitude, stop.lat, stop.lng);
    const radius = stop.triggerRadius || 50;
    if (dist < radius) {
      setInRadiusCount(c => c + 1);
    } else {
      setInRadiusCount(0);
    }
  }, [userLoc, tracking, stops, activeStopIdx]);

  useEffect(() => {
    if (inRadiusCount >= 3 && arrivedStopIdx !== activeStopIdx) {
      setArrivedStopIdx(activeStopIdx);
    } else if (inRadiusCount === 0 && arrivedStopIdx === activeStopIdx) {
      setArrivedStopIdx(null);
    }
  }, [inRadiusCount, arrivedStopIdx, activeStopIdx]);

  const markStopArrived = () => {
    if (arrivedStopIdx === null) return;
    setCompletedStops(prev => new Set(prev).add(arrivedStopIdx));
    setArrivedStopIdx(null);
    if (arrivedStopIdx + 1 < stops.length) {
      setActiveStopIdx(arrivedStopIdx + 1);
    } else {
      stopTracking();
      Alert.alert('Tour Complete! 🎉', "You've reached every stop on this tour.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: theme.text }}>Tour not found.</Text>
      </View>
    );
  }

  const mapPoints = [
    ...(tour.startLat != null && tour.startLng != null ? [{ latitude: tour.startLat, longitude: tour.startLng }] : []),
    ...stops.map((s: any) => ({ latitude: s.lat, longitude: s.lng })),
  ];
  const mapRegion = mapPoints.length > 0 ? {
    latitude: mapPoints.reduce((a, p) => a + p.latitude, 0) / mapPoints.length,
    longitude: mapPoints.reduce((a, p) => a + p.longitude, 0) / mapPoints.length,
    latitudeDelta: 0.4,
    longitudeDelta: 0.4,
  } : undefined;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {tour.coverImage ? (
          <Image source={{ uri: tour.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 48 }}>🗺️</Text>
          </View>
        )}
        <SafeAreaView edges={['top']} style={styles.backBtnSafe}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
        </SafeAreaView>

        <View style={{ padding: 16 }}>
          <Text style={[styles.title, { color: theme.text }]}>{tour.title}</Text>
          <Text style={[styles.location, { color: theme.textSecondary }]}>📍 {tour.location}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{tour.description}</Text>

          { }
          {mapRegion && (
            <View style={styles.mapContainer}>
              <MapView style={StyleSheet.absoluteFill} initialRegion={mapRegion} scrollEnabled zoomEnabled>
                {tour.startLat != null && tour.startLng != null && (
                  <Marker coordinate={{ latitude: tour.startLat, longitude: tour.startLng }} title={tour.startName || 'Start Point'} pinColor={Colors.sunset500} />
                )}
                {stops.map((s: any, i: number) => (
                  <Marker
                    key={i}
                    coordinate={{ latitude: s.lat, longitude: s.lng }}
                    title={s.stopName || `Stop ${i + 1}`}
                    pinColor={completedStops.has(i) ? Colors.brand : i === activeStopIdx && tracking ? Colors.sunset500 : undefined}
                  />
                ))}
                {mapPoints.length > 1 && <Polyline coordinates={mapPoints} strokeColor={Colors.brand} strokeWidth={3} />}
                {tracking && userLoc && (
                  <Marker coordinate={userLoc} title="You are here" pinColor="#2e86de" />
                )}
              </MapView>
            </View>
          )}

          { }
          <View style={[styles.trackingBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                {tracking ? 'Live tracking active' : 'Live GPS tracking'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                {tracking
                  ? `Watching for arrival at stop ${activeStopIdx + 1} of ${stops.length}`
                  : permissionDenied
                    ? 'Location permission denied — enable it in Settings to use this.'
                    : "We'll notify you when you're within range of each stop."}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.trackBtn, { backgroundColor: tracking ? theme.background : Colors.brand, borderColor: theme.border, borderWidth: tracking ? 1 : 0 }]}
              onPress={tracking ? stopTracking : startTracking}
            >
              <Text style={{ color: tracking ? theme.text : '#fff', fontWeight: '700', fontSize: 12 }}>{tracking ? 'Stop' : 'Start'}</Text>
            </TouchableOpacity>
          </View>

          {arrivedStopIdx !== null && stops[arrivedStopIdx] && (
            <View style={[styles.arrivalCard, { backgroundColor: Colors.brand + '15', borderColor: Colors.brand }]}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 14, marginBottom: 4 }}>
                📍 You've arrived at {stops[arrivedStopIdx].stopName}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 10 }} numberOfLines={2}>
                {stops[arrivedStopIdx].description}
              </Text>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: Colors.brand }]} onPress={markStopArrived}>
                <Text style={styles.confirmBtnText}>
                  {arrivedStopIdx + 1 < stops.length ? 'Continue to Next Stop' : 'Finish Tour'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          { }
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Itinerary</Text>
          {stops.map((s: any, i: number) => {
            const isDone = completedStops.has(i);
            const isActive = tracking && i === activeStopIdx;
            return (
              <View key={i} style={[styles.stopCard, { backgroundColor: theme.card, borderColor: isActive ? Colors.brand : theme.border, borderWidth: isActive ? 2 : 1 }]}>
                <View style={[styles.stopBadge, { backgroundColor: isDone ? Colors.brand : isActive ? Colors.sunset500 : Colors.brand }]}>
                  <Text style={styles.stopBadgeText}>{isDone ? '✓' : i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stopName, { color: theme.text }]}>{s.stopName}</Text>
                  {s.arrivalOffsetMinutes != null && (
                    <Text style={[styles.stopTime, { color: Colors.brand }]}>
                      Arrives {formatArrivalTime(s.arrivalOffsetMinutes)} · {formatDurationLabel(s.durationMinutes)}
                    </Text>
                  )}
                  {!!s.description && <Text style={[styles.stopDesc, { color: theme.textSecondary }]} numberOfLines={2}>{s.description}</Text>}
                </View>
              </View>
            );
          })}

          { }
          {tour.price ? (
            <TouchableOpacity style={[styles.bookBtn, { backgroundColor: Colors.brand }]} onPress={openBookingPanel}>
              <Text style={styles.bookBtnText}>Book This Tour — LKR {tour.price.toLocaleString()}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      { }
      {showBookingPanel && (
        <View style={[styles.bookingPanel, { backgroundColor: theme.card }]}>
          <View style={styles.bookingPanelHeader}>
            <Text style={[styles.bookingPanelTitle, { color: theme.text }]}>Book This Tour</Text>
            <TouchableOpacity onPress={() => setShowBookingPanel(false)}>
              <Text style={{ color: theme.textSecondary, fontSize: 22 }}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.travelersRow}>
            <Text style={{ color: theme.text, fontWeight: '600' }}>Travelers</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.travelerChip, { backgroundColor: travelers === n ? Colors.brand : theme.backgroundElement }]}
                  onPress={() => setTravelers(n)}
                >
                  <Text style={{ color: travelers === n ? '#fff' : theme.text, fontWeight: '700', fontSize: 12 }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: theme.text, fontWeight: '600', marginBottom: 6 }}>Travel Date</Text>
            <TouchableOpacity
              style={[{ borderRadius: 10, borderWidth: 1, borderColor: travelDateError ? Colors.error : theme.border, backgroundColor: theme.backgroundElement, paddingHorizontal: 12, paddingVertical: 14 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: travelDate || theme.textSecondary, fontSize: 14 }}>
                {travelDate || 'Select Date (YYYY-MM-DD)'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={travelDate ? new Date(travelDate) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event: any, selectedDate?: Date) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (event.type === 'set' && selectedDate) {
                    setTravelDate(selectedDate.toISOString().split('T')[0]);
                    setTravelDateError('');
                  } else if (Platform.OS === 'ios' && selectedDate) {
                    setTravelDate(selectedDate.toISOString().split('T')[0]);
                    setTravelDateError('');
                  }
                }}
              />
            )}
            {!!travelDateError && <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{travelDateError}</Text>}
          </View>

          <ScrollView style={{ maxHeight: 260 }}>
            <View style={styles.sectionRow}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Vehicle</Text>
              <TouchableOpacity
                onPress={() => { setWantsVehicle(w => !w); if (wantsVehicle) setSelectedVehicleId(null); }}
                style={[styles.toggleChip, { borderColor: !wantsVehicle ? Colors.brand : theme.border, backgroundColor: !wantsVehicle ? Colors.brand + '15' : 'transparent' }]}
              >
                <Text style={{ color: !wantsVehicle ? Colors.brand : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>Self-drive / no vehicle</Text>
              </TouchableOpacity>
            </View>
            {!wantsVehicle ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 14, fontSize: 12 }}>
                You'll make your own way to each stop.
              </Text>
            ) : vehiclesLoading ? (
              <ActivityIndicator color={Colors.brand} style={{ marginVertical: 20 }} />
            ) : suitableVehicles.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                No vehicles available for {travelers} travelers.
              </Text>
            ) : (
              suitableVehicles.map(v => {
                const vid = v.id || v._id;
                const active = selectedVehicleId === vid;
                return (
                  <TouchableOpacity
                    key={vid}
                    style={[styles.vehicleRow, { borderColor: active ? Colors.brand : theme.border, backgroundColor: active ? Colors.brand + '11' : 'transparent' }]}
                    onPress={() => setSelectedVehicleId(vid)}
                  >
                    <Text style={{ fontSize: 26 }}>{VEHICLE_ICON[v.type] || '🚗'}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{v.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{v.capacity} seats{v.driverIncluded ? ' · Driver included' : ''}</Text>
                    </View>
                    <Text style={{ color: theme.text, fontWeight: '800' }}>LKR {v.pricePerDay.toLocaleString()}</Text>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={[styles.sectionRow, { marginTop: 16 }]}>
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>Private Guide</Text>
              <TouchableOpacity
                onPress={() => { setWantsGuide(w => !w); if (wantsGuide) setSelectedGuideId(null); }}
                style={[styles.toggleChip, { borderColor: wantsGuide ? Colors.brand : theme.border, backgroundColor: wantsGuide ? Colors.brand + '15' : 'transparent' }]}
              >
                <Text style={{ color: wantsGuide ? Colors.brand : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>{wantsGuide ? 'Guide added' : 'Add optional guide'}</Text>
              </TouchableOpacity>
            </View>
            {!wantsGuide ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 14, fontSize: 12 }}>
                Explore with the in-app audio guide — no private guide needed.
              </Text>
            ) : guidesLoading ? (
              <ActivityIndicator color={Colors.brand} style={{ marginVertical: 20 }} />
            ) : activeGuides.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', paddingVertical: 20 }}>
                No guides available right now.
              </Text>
            ) : (
              activeGuides.map(g => {
                const gid = g.id || g._id;
                const active = selectedGuideId === gid;
                return (
                  <TouchableOpacity
                    key={gid}
                    style={[styles.vehicleRow, { borderColor: active ? Colors.brand : theme.border, backgroundColor: active ? Colors.brand + '11' : 'transparent' }]}
                    onPress={() => setSelectedGuideId(gid)}
                  >
                    <Text style={{ fontSize: 26 }}>🧭</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{g.name}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{(g.languages || []).join(', ') || 'English'} · {g.yearsExperience} yrs exp.</Text>
                    </View>
                    <Text style={{ color: theme.text, fontWeight: '800' }}>LKR {g.pricePerDay.toLocaleString()}</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.totalRow}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Estimated Total</Text>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>LKR {estimatedTotal.toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: Colors.brand, opacity: booking || (wantsVehicle && !selectedVehicleId) || (wantsGuide && !selectedGuideId) ? 0.6 : 1 }]}
            onPress={confirmBooking}
            disabled={booking || (wantsVehicle && !selectedVehicleId) || (wantsGuide && !selectedGuideId)}
          >
            {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>Confirm Booking</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  coverImage: { width, height: 240 },
  backBtnSafe: { position: 'absolute', top: 0, left: 0 },
  backBtn: { marginLeft: 12, marginTop: 8, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 24, marginTop: -2 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  location: { fontSize: 13, marginBottom: 10 },
  description: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  mapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  trackingBar: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  trackBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  arrivalCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  stopCard: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  stopBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  stopBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stopName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  stopTime: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  stopDesc: { fontSize: 13, lineHeight: 18 },
  bookBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bookingPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  bookingPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bookingPanelTitle: { fontSize: 18, fontWeight: '800' },
  travelersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  travelerChip: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 14, padding: 12, marginBottom: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  toggleChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  confirmBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
