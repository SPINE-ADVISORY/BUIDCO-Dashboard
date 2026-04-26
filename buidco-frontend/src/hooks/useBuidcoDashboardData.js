import { useState, useEffect, useMemo } from "react";
import { apiEnabled } from "../api/config";
import {
  getProjects,
  getSectorKpis,
  getOpenFlags,
  getCosEotTimeline,
} from "../api/buidcoApi";
import {
  SECTORS,
  PROJECTS_INIT,
  COS_EOT_DATA,
  MANAGEMENT_FLAGS,
  projVariation as mockProjVariation,
} from "../data/buidcoMockData";
import {
  mapApiProjectRow,
  mapSectorKpiRow,
  mapFlagApiRow,
  mapCosTimelineRow,
  buildProjVariation,
} from "../utils/mapApiProject";

/**
 * Dashboard data: uses REST API when `VITE_API_URL` is set, otherwise mock JSON.
 */
export function useBuidcoDashboardData() {
  const [loadState, setLoadState] = useState(
    () => (apiEnabled ? "loading" : "ready")
  );
  const [loadError, setLoadError] = useState(null);

  const [projects, setProjects] = useState(PROJECTS_INIT);
  const [sectorCards, setSectorCards] = useState(SECTORS);
  const [managementFlags, setManagementFlags] = useState(MANAGEMENT_FLAGS);
  const [cosEotRows, setCosEotRows] = useState(COS_EOT_DATA);

  const projVariation = useMemo(() => {
    if (!apiEnabled) return mockProjVariation;
    return buildProjVariation(cosEotRows);
  }, [apiEnabled, cosEotRows]);

  useEffect(() => {
    if (!apiEnabled) return undefined;

    let cancelled = false;
    (async () => {
      setLoadState("loading");
      setLoadError(null);
      try {
        const [projRes, secRes, flagsRes, cosRes] = await Promise.all([
          getProjects({ limit: 2000 }),
          getSectorKpis(),
          getOpenFlags(),
          getCosEotTimeline(),
        ]);
        if (cancelled) return;

        setProjects((projRes.data || []).map(mapApiProjectRow));
        setSectorCards((secRes.data || []).map(mapSectorKpiRow));
        setManagementFlags((flagsRes.data || []).map(mapFlagApiRow));
        setCosEotRows((cosRes.data || []).map(mapCosTimelineRow));

        setLoadState("ready");
      } catch (e) {
        if (!cancelled) {
          setLoadError(e?.message || String(e));
          setLoadState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    apiEnabled,
    loadState,
    loadError,
    projects,
    setProjects,
    sectorCards,
    setSectorCards,
    managementFlags,
    setManagementFlags,
    cosEotRows,
    setCosEotRows,
    projVariation,
  };
}
