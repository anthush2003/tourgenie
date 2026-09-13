import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '@/services/config';
import { apiFetch } from '@/services/auth';

export function useApi<T>(endpoint: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!cancelledRef.current) setData(json);
    } catch (e: unknown) {
      if (!cancelledRef.current) setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  
  }, [endpoint, ...deps]);

  useEffect(() => {
    cancelledRef.current = false;
    fetchData();
    return () => { cancelledRef.current = true; };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
