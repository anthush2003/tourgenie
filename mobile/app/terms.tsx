import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using TourGenie, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.',
  },
  {
    title: '2. Bookings and Payments',
    body: 'Tour, hotel, vehicle, and guide bookings made through TourGenie are subject to availability at the time of confirmation. Prices shown, including fuel-cost estimates in Daily Mode and Create Tour, are estimates based on live data sources and may vary slightly from actual costs incurred. All bookings are confirmed only once payment has been processed and a confirmation email has been sent.',
  },
  {
    title: '3. Cancellations and Refunds',
    body: 'Cancellation terms vary by tour, hotel, and vehicle/guide provider and are shown at the time of booking. Refund eligibility depends on how far in advance a booking is cancelled relative to the scheduled date.',
  },
  {
    title: '4. Live Navigation and Location Features',
    body: 'Live map routes, proximity alerts, and fuel/rest-stop suggestions are provided for convenience and rely on third-party mapping and location data. TourGenie does not guarantee real-time accuracy in areas with poor signal or outdated map data, and travellers remain responsible for their own safety and route decisions while travelling.',
  },
  {
    title: '5. User Conduct',
    body: 'You agree not to misuse the platform, including submitting false booking information, attempting to interfere with the AI trip-planning or navigation systems, or using the service for any unlawful purpose.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'TourGenie facilitates bookings with independent hotels, tour operators, drivers, and guides. We are not liable for the acts or omissions of these independent providers, though we will assist in good faith with resolving any disputes.',
  },
  {
    title: '7. Changes to These Terms',
    body: 'We may update these terms from time to time. Continued use of TourGenie after an update constitutes acceptance of the revised terms.',
  },
  {
    title: '8. Contact',
    body: 'Questions about these terms can be sent to hello@serendib.lk.',
  },
];

export default function TermsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: theme.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Terms of Service</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: theme.textSecondary }]}>Last updated: July 2026</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerSafe: { borderBottomWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 26, marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  updated: { fontSize: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 21 },
});
