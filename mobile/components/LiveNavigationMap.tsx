import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, MapPin } from 'lucide-react-native';
import { fetchPOIs, fetchRoute, geocodeSearch, POI, RouteResult, SearchResult } from '../utils/mapApis';

export interface NearbyDestination {
  id: string;
  name: string;
  lat: number;
  lng: number;
  emoji?: string;
}

interface Props {
  height: number;
  theme: typeof Colors.light | typeof Colors.dark;
  destinations?: NearbyDestination[];
  isExpanded?: boolean;
  onPressDestination?: (d: NearbyDestination) => void;
  onExpand?: () => void;
}

const SRI_LANKA_FALLBACK: Region = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

const POI_CATEGORIES = [
  { key: "restaurant", label: "Food", emoji: "🍽️", color: "#e8a87c", query: "amenity=restaurant" },
  { key: "fuel", label: "Fuel", emoji: "⛽", color: "#c17b7b", query: "amenity=fuel" },
  { key: "hospital", label: "Medical", emoji: "🏥", color: "#e07b7b", query: "amenity=hospital" },
  { key: "atm", label: "ATM", emoji: "💳", color: "#6b9e7a", query: "amenity=atm" },
] as const;

export default function LiveNavigationMap({ height, theme, destinations = [], isExpanded = false, onPressDestination, onExpand }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const isMounted = useRef(true);
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; heading?: number | null } | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const [isFollowing, setIsFollowing] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pois, setPois] = useState<POI[]>([]);
  const [activePOIKey, setActivePOIKey] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [destinationStr, setDestinationStr] = useState<string>("");

  const startWatching = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionState('denied');
        return;
      }
      setPermissionState('granted');

      try {
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!isMounted.current) return;
        setUserLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude, heading: initial.coords.heading });
        mapRef.current?.animateToRegion({
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 600);
      } catch { }

      watchSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (loc) => {
          if (!isMounted.current) return;
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, heading: loc.coords.heading });
          if (isFollowing) {
            mapRef.current?.animateCamera({ center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude }, heading: loc.coords.heading || 0 });
          }
        }
      );
      if (!isMounted.current && watchSubscription.current) {
        watchSubscription.current.remove();
        watchSubscription.current = null;
      }
    } catch {
      if (isMounted.current) setPermissionState('denied');
    }
  }, [isFollowing]);

  useEffect(() => {
    isMounted.current = true;
    startWatching();
    return () => {
      isMounted.current = false;
      watchSubscription.current?.remove();
      watchSubscription.current = null;
    };
  }, [startWatching]);

  const recenter = useCallback(() => {
    if (userLocation) {
      setIsFollowing(true);
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  }, [userLocation]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); setShowSearchDrop(false); return; }
    searchTimerRef.current = setTimeout(async () => {
      const results = await geocodeSearch(searchQuery, userLocation?.latitude || 7.87, userLocation?.longitude || 80.77);
      setSearchResults(results);
      setShowSearchDrop(results.length > 0);
    }, 500);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, userLocation]);

  const navigateTo = async (lat: number, lng: number, label: string) => {
    setDestinationStr(label);
    setShowSearchDrop(false);
    setSearchQuery("");
    setActivePOIKey(null);
    setPois([]);
    setIsFollowing(false);

    if (userLocation) {
      const result = await fetchRoute(userLocation.latitude, userLocation.longitude, lat, lng, "driving");
      if (result) {
        setRouteResult(result);
        mapRef.current?.fitToCoordinates(result.coords, { edgePadding: { top: 100, right: 50, bottom: 200, left: 50 }, animated: true });
      }
    } else {
      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    }
  };

  const findNearest = async (key: string) => {
    if (activePOIKey === key) { setActivePOIKey(null); setPois([]); return; }
    const cat = POI_CATEGORIES.find((c) => c.key === key);
    if (!cat || !userLocation) return;
    setActivePOIKey(key);
    setPois([]);
    const results = await fetchPOIs(userLocation.latitude, userLocation.longitude, cat.query, 2000);
    setPois(results.slice(0, 10));
    if (results.length > 0) {
      setIsFollowing(false);
      mapRef.current?.animateToRegion({ latitude: results[0].lat, longitude: results[0].lon, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    }
  };

  const clearRoute = () => {
    setRouteResult(null);
    setDestinationStr("");
    recenter();
  };

  const activePOICat = POI_CATEGORIES.find((c) => c.key === activePOIKey);

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={SRI_LANKA_FALLBACK}
        showsUserLocation={permissionState === 'granted'}
        showsMyLocationButton={false}
        mapPadding={{ top: isExpanded ? insets.top + 130 : insets.top + 60, right: 10, bottom: routeResult ? 100 : 20, left: 10 }}
        showsCompass
        followsUserLocation={false}
        rotateEnabled
        onRegionChangeComplete={(region, details) => {
          if (details?.isGesture) setIsFollowing(false);
        }}
      >
        {!isExpanded && destinations.map((d) => (
          <Marker key={d.id} coordinate={{ latitude: d.lat, longitude: d.lng }} title={d.name} onPress={() => onPressDestination?.(d)}>
            <View style={styles.pinBubble}>
              <Text style={styles.pinEmoji}>{d.emoji || '📍'}</Text>
            </View>
          </Marker>
        ))}

        {isExpanded && pois.map((poi) => (
          <Marker key={poi.id} coordinate={{ latitude: poi.lat, longitude: poi.lon }} title={poi.name} onPress={() => navigateTo(poi.lat, poi.lon, poi.name)}>
            <View style={[styles.pinBubble, { borderColor: activePOICat?.color || Colors.brand }]}>
              <Text style={styles.pinEmoji}>{activePOICat?.emoji || '📍'}</Text>
            </View>
          </Marker>
        ))}

        {routeResult && (
          <Polyline coordinates={routeResult.coords} strokeColor="#2b4d36" strokeWidth={5} />
        )}
      </MapView>

      {isExpanded && (
        <View style={[styles.searchOverlay, { top: insets.top + 60 }]}>
          <View style={styles.searchBar}>
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search destination..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => searchResults.length > 0 && setShowSearchDrop(true)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setShowSearchDrop(false); }}>
                <X size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          {showSearchDrop && (
            <View style={[styles.searchResults, { backgroundColor: theme.card }]}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {searchResults.map((res, i) => (
                  <TouchableOpacity key={i} style={styles.searchResultItem} onPress={() => navigateTo(res.lat, res.lon, res.display_name.split(",")[0])}>
                    <MapPin size={16} color={Colors.brand} style={{ marginTop: 2, marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.searchResultText, { color: theme.text }]} numberOfLines={1}>{res.display_name.split(",")[0]}</Text>
                      <Text style={[styles.searchResultSub, { color: theme.textSecondary }]} numberOfLines={1}>{res.display_name.split(",").slice(1, 3).join(",")}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {POI_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, activePOIKey === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '20' }]}
                onPress={() => findNearest(cat.key)}
              >
                <Text style={styles.chipText}>{cat.emoji} {cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {permissionState === 'denied' && (
        <View style={[styles.overlay, { backgroundColor: theme.card }]}>
          <Text style={[styles.overlayTitle, { color: theme.text }]}>Location access needed</Text>
          <Text style={[styles.overlaySub, { color: theme.textSecondary }]}>
            Enable location in your device settings to see live navigation on the map.
          </Text>
          <TouchableOpacity style={styles.overlayBtn} onPress={startWatching}>
            <Text style={styles.overlayBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {permissionState === 'checking' && (
        <View style={[styles.overlay, { backgroundColor: theme.card }]}>
          <ActivityIndicator color={Colors.brand} />
          <Text style={[styles.overlaySub, { color: theme.textSecondary, marginTop: 8 }]}>Finding your location…</Text>
        </View>
      )}

      {permissionState === 'granted' && (
        <TouchableOpacity style={[styles.recenterBtn, { backgroundColor: theme.card, bottom: routeResult ? 100 : 16 }]} onPress={recenter} activeOpacity={0.85}>
          <Text style={styles.recenterIcon}>🎯</Text>
        </TouchableOpacity>
      )}

      {onExpand && (
        <TouchableOpacity style={[styles.expandBtn, { backgroundColor: theme.card, top: isExpanded ? insets.top + 16 : insets.top + 60 }]} onPress={onExpand} activeOpacity={0.85}>
          <Text style={styles.expandText}>{isExpanded ? 'Close Map ↙' : 'Full Map ↗'}</Text>
        </TouchableOpacity>
      )}

      {isExpanded && routeResult && (
        <View style={[styles.routeSheet, { backgroundColor: theme.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.routeTitle, { color: theme.text }]} numberOfLines={1}>{destinationStr}</Text>
            <Text style={[styles.routeSub, { color: theme.textSecondary }]}>
              {routeResult.distance < 1000 ? Math.round(routeResult.distance) + ' m' : (routeResult.distance / 1000).toFixed(1) + ' km'} · {Math.round(routeResult.duration / 60)} min
            </Text>
          </View>
          <TouchableOpacity style={styles.clearRouteBtn} onPress={clearRoute}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden' },
  pinBubble: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.brand,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  pinEmoji: { fontSize: 16 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  overlayTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  overlaySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  overlayBtn: { marginTop: 14, backgroundColor: Colors.brand, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  overlayBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  recenterBtn: {
    position: 'absolute', right: 16, width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  recenterIcon: { fontSize: 18 },
  expandBtn: {
    position: 'absolute', right: 16, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  expandText: { fontSize: 12, fontWeight: '700', color: Colors.brand },
  searchOverlay: { position: 'absolute', left: 16, right: 16, zIndex: 100 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  searchResults: { marginTop: 8, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5, overflow: 'hidden' },
  searchResultItem: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  searchResultText: { fontSize: 14, fontWeight: '600' },
  searchResultSub: { fontSize: 12, marginTop: 2 },
  chipsRow: { marginTop: 12, paddingBottom: 8 },
  chip: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e0e0e0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  chipText: { fontSize: 13, fontWeight: '600' },
  routeSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  routeTitle: { fontSize: 16, fontWeight: '700' },
  routeSub: { fontSize: 13, marginTop: 4 },
  clearRouteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' }
});
