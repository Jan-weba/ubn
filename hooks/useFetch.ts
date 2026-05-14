import {
  useCallback,
  useEffect,
  useRef,
  useState,
  DependencyList,
} from 'react';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFetch<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeFetch = useCallback(async () => {
    // Cancel previous
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn(controller.signal);

      // Prevent state updates after abort
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err: any) {
      if (
        err.name === 'AbortError' ||
        controller.signal.aborted
      ) {
        return;
      }

      setError(err.message || 'Something went wrong');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    executeFetch();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [executeFetch]);

  return {
    data,
    loading,
    error,
    refetch: executeFetch,
  };
}