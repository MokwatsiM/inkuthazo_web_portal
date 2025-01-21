// src/hooks/useCachedData.ts
import { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';

interface UseCachedDataOptions<T> {
  key: string;
  duration: number; // Cache duration in minutes
  fetchFn: () => Promise<T>;
  dependencies?: any[];
}

export function useCachedData<T>({ 
  key, 
  duration, 
  fetchFn, 
  dependencies = [] 
}: UseCachedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedData = cacheService.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetchFn();
        
        // Cache the result
        cacheService.set(key, freshData, duration);
        
        setData(freshData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...dependencies, key]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const freshData = await fetchFn();
      cacheService.set(key, freshData, duration);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
