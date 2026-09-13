import Constants from 'expo-constants';
import { Platform } from 'react-native';


function resolveApiBase() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':').shift();
    return `http://${host}:5000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
}

export const API_BASE = resolveApiBase();

export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function resolveMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) return `${API_ORIGIN}${path}`;
  return path;
}
