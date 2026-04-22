/** Base URL for BUIDCO REST API (no trailing slash) */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export const apiEnabled = Boolean(API_BASE_URL);
