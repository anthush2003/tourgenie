import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from './config';

const TOKEN_KEY = 'tourgenie_auth_token';
const USER_KEY = 'tourgenie_auth_user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

let cachedToken: string | null | undefined = undefined;

let logoutListener: (() => void) | null = null;

export function setLogoutListener(listener: () => void) {
  logoutListener = listener;
}

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  try {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    cachedToken = t;
    return t;
  } catch {
    cachedToken = null;
    return null;
  }
}

export async function getStoredUser(): Promise<AuthUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function persistSession(token: string, user: AuthUser) {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Login failed. Check your email and password.');
  const user: AuthUser = { id: data.user.id || data.user._id, name: data.user.name, email: data.user.email, role: data.user.role };
  await persistSession(data.token, user);
  return user;
}

export async function register(name: string, email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Registration failed. Please try again.');
  const user: AuthUser = { id: data.user.id || data.user._id, name: data.user.name, email: data.user.email, role: data.user.role };
  await persistSession(data.token, user);
  return user;
}

export async function logout(): Promise<void> {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
  if (logoutListener) {
    logoutListener();
  }
}

export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = await getAuthHeader();
  const res = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      ...headers,
    },
  });
  if (res.status === 401) {
    await logout();
  }
  return res;
}
