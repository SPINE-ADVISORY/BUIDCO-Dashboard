import { useState, useEffect } from "react";
import { apiEnabled } from "../api/config";
import { getPortfolioKpis } from "../api/buidcoApi";

/**
 * Example: load portfolio KPIs from API when `VITE_API_URL` is set.
 * Wire `data` into your dashboard when migrating off mock data.
 */
export function useRemotePortfolioKpis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!apiEnabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getPortfolioKpis();
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error, apiEnabled };
}
