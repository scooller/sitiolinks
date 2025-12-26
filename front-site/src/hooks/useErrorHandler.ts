import { useState, useCallback } from 'react';

export interface ErrorState {
  message: string;
  code?: string;
  details?: any;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((err: any) => {

    let errorState: ErrorState = {
      message: 'Ha ocurrido un error inesperado',
    };

    // GraphQL errors
    if (err?.errors && Array.isArray(err.errors)) {
      errorState.message = err.errors[0]?.message || errorState.message;
      errorState.code = err.errors[0]?.extensions?.code;
      errorState.details = err.errors;
    }
    // Network errors
    else if (err instanceof TypeError && err.message === 'Failed to fetch') {
      errorState.message = 'Error de conexión. Verifica tu conexión a internet.';
      errorState.code = 'NETWORK_ERROR';
    }
    // HTTP errors
    else if (err?.response) {
      errorState.message = err.response?.data?.message || `Error del servidor (${err.response.status})`;
      errorState.code = `HTTP_${err.response.status}`;
    }
    // Generic errors
    else if (err?.message) {
      errorState.message = err.message;
    }

    setError(errorState);
    return errorState;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(async (fn: () => Promise<any>) => {
    setIsRetrying(true);
    clearError();
    
    try {
      const result = await fn();
      setIsRetrying(false);
      return result;
    } catch (err) {
      setIsRetrying(false);
      handleError(err);
      throw err;
    }
  }, [handleError, clearError]);

  return {
    error,
    handleError,
    clearError,
    retry,
    isRetrying,
  };
}
