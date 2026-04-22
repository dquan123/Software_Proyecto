const envApiUrl = import.meta.env.VITE_API_URL?.trim();

const derivedApiUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://127.0.0.1:3000";

export const API_BASE_URL = (envApiUrl || derivedApiUrl).replace(/\/+$/, "");

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
