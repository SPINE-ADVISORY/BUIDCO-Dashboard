import { API_BASE_URL } from "./config";

/**
 * @param {string} path - e.g. "/api/v1/portfolio/kpis"
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  if (!API_BASE_URL) {
    throw new Error(
      "VITE_API_URL is not set. Add it to .env (see .env.example) and restart Vite."
    );
  }
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    throw new Error(
      typeof body === "object" && body?.error
        ? body.error
        : `HTTP ${res.status}: ${text}`
    );
  }
  return res.json();
}
