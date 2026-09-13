import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tourgenie_session_id';

function generateSessionId(): string {
  
  
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `mobile_${Date.now().toString(36)}_${rand()}_${rand()}`;
}

let cachedSessionId: string | null = null;
let inflight: Promise<string> | null = null;


export async function getSessionId(): Promise<string> {
  if (cachedSessionId) return cachedSessionId;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      if (existing) {
        cachedSessionId = existing;
        return existing;
      }
      const fresh = generateSessionId();
      await AsyncStorage.setItem(STORAGE_KEY, fresh);
      cachedSessionId = fresh;
      return fresh;
    } catch {
      
      
      
      
      const fallback = generateSessionId();
      cachedSessionId = fallback;
      return fallback;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
