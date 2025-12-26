import { useState, useEffect, useCallback } from 'react';

/**
 * Hook genérico para manejar fetching de datos con loading, error y retry.
 * Consolida el patrón común de useEffect + useState para loading/error.
 * 
 * @example
 * const { data, loading, error, retry } = useFetchData(async () => {
 *   const response = await graphqlRequest({ query: '...' });
 *   return response.data;
 * }, [dependencies]);
 */
export function useFetchData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const executeFetch = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    executeFetch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const retry = useCallback(() => {
    executeFetch(true);
  }, [executeFetch]);

  return {
    data,
    loading,
    error,
    retry,
    isRetrying,
    setData, // Permitir actualización manual del estado
  };
}
