import { useState, useEffect, useCallback } from 'react';

const NETWORK_ERROR_MSGS = ['Failed to fetch', 'NetworkError', 'Network request failed'];

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return NETWORK_ERROR_MSGS.some(m => err.message.includes(m));
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Hook genérico para manejar fetching de datos con loading, error y retry.
 * Auto-retry con backoff exponencial (3 intentos, 1s→2s→4s) en errores de red.
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

    const MAX_ATTEMPTS = 3;
    let lastErr: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const result = await fetchFn();
        setData(result);
        setError(null);
        setLoading(false);
        setIsRetrying(false);
        return;
      } catch (err) {
        lastErr = err;
        // Only retry on network errors, not business/auth errors
        if (!isNetworkError(err) || attempt === MAX_ATTEMPTS - 1) break;
        await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
      }
    }

    const message = lastErr instanceof Error ? lastErr.message : 'Error al cargar datos';
    setError(message);
    setLoading(false);
    setIsRetrying(false);
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
    setData,
  };
}
