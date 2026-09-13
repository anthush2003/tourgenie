import { Tabs } from 'expo-router';
import { useColorScheme, Platform, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { AuthProvider } from '@/context/AuthContext';

function TabIcon({ emoji }: { emoji: string }) {
  return (
    <Text style={{ fontSize: Platform.OS === 'web' ? 16 : 20, lineHeight: Platform.OS === 'web' ? 20 : 24 }}>
      {emoji}
    </Text>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.tabBar,
              borderTopColor: theme.tabBarBorder,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 60 : 68,
              paddingBottom: Platform.OS === 'ios' ? 28 : Platform.OS === 'web' ? 8 : 10,
              paddingTop: 8,
            },
            tabBarActiveTintColor: Colors.brand,
            tabBarInactiveTintColor: theme.textSecondary,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Daily Mode',
              tabBarIcon: () => <TabIcon emoji="🗺️" />,
            }}
          />
          <Tabs.Screen
            name="tours"
            options={{
              title: 'Tours',
              tabBarIcon: () => <TabIcon emoji="🏔️" />,
            }}
          />
          <Tabs.Screen
            name="hotels"
            options={{
              title: 'Hotels',
              tabBarIcon: () => <TabIcon emoji="🏨" />,
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'AI Guide',
              tabBarIcon: () => <TabIcon emoji="✨" />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: () => <TabIcon emoji="👤" />,
            }}
          />
          {}
          <Tabs.Screen name="create-tour" options={{ href: null }} />
          <Tabs.Screen name="trips" options={{ href: null }} />
          {}
          <Tabs.Screen name="tour-detail" options={{ href: null }} />
          <Tabs.Screen name="hotel-detail" options={{ href: null }} />
          <Tabs.Screen name="privacy" options={{ href: null }} />
          <Tabs.Screen name="terms" options={{ href: null }} />
        </Tabs>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
