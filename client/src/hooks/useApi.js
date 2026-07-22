import { useState, useEffect, useCallback } from 'react';

/**
 * useApi(apiFn, ...args)
 * Calls apiFn(...args) on mount, tracks loading/error/data state.
 * Returns { data, loading, error, refetch }
 */
export function useApi(apiFn, ...args) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
