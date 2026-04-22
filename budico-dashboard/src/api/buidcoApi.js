/**
 * Typed-ish wrappers for BUIDCO API (`budico-dashboardback/server`).
 * Use with `VITE_API_URL` set; see `.env.example`.
 */
import { apiFetch } from "./client";

const v1 = "/api/v1";

export async function getPortfolioKpis() {
  return apiFetch(`${v1}/portfolio/kpis`);
}

export async function getSectorKpis() {
  return apiFetch(`${v1}/sectors/kpis`);
}

/**
 * @param {Record<string, string | number | undefined>} [params]
 */
export async function getProjects(params) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, val]) => {
      if (val !== undefined && val !== null && val !== "")
        q.set(k, String(val));
    });
  }
  const qs = q.toString();
  return apiFetch(`${v1}/projects${qs ? `?${qs}` : ""}`);
}

export async function getProjectById(projectId) {
  return apiFetch(`${v1}/projects/${projectId}`);
}

export async function getStatusBreakdown() {
  return apiFetch(`${v1}/projects/meta/status-breakdown`);
}

export async function getCosEotTimeline(projectId) {
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
  return apiFetch(`${v1}/cos-eot/timeline${qs}`);
}

export async function getCosEotSummary() {
  return apiFetch(`${v1}/cos-eot/summary`);
}

export async function getDcActionFlags() {
  return apiFetch(`${v1}/flags/dc-action`);
}

export async function getOpenFlags() {
  return apiFetch(`${v1}/flags/open`);
}

export async function getFlagSeverityCounts() {
  return apiFetch(`${v1}/flags/meta/severity-counts`);
}

export async function getReferenceSectors() {
  return apiFetch(`${v1}/reference/sectors`);
}

export async function getReferenceUlbs() {
  return apiFetch(`${v1}/reference/ulbs`);
}

export async function getRolePermissions() {
  return apiFetch(`${v1}/reference/role-permissions`);
}
