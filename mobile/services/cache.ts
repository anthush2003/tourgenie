import AsyncStorage from '@react-native-async-storage/async-storage';


export async function setCachedData(key: string, data: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(`cache_${key}`, jsonValue);
  } catch (e) {
    console.warn(`Failed to cache data for key: ${key}`, e);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(`cache_${key}`);
    return jsonValue != null ? JSON.parse(jsonValue) as T : null;
  } catch (e) {
    console.warn(`Failed to retrieve cached data for key: ${key}`, e);
    return null;
  }
}
