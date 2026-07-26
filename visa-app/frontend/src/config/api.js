const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function getBrowserLocation() {
  return typeof window !== "undefined" ? window.location : null;
}

function formatHostname(hostname) {
  return hostname.includes(":") && !hostname.startsWith("[")
    ? `[${hostname}]`
    : hostname;
}

export function resolveApiBaseUrl(
  configuredUrl = import.meta.env.VITE_API_URL,
  browserLocation = getBrowserLocation(),
  defaultPort = import.meta.env.VITE_API_PORT || "3000",
) {
  const normalizedUrl = (configuredUrl || "").trim().replace(/\/+$/, "");

  if (!browserLocation?.hostname) {
    return normalizedUrl;
  }

  if (!normalizedUrl) {
    return `${browserLocation.protocol}//${formatHostname(browserLocation.hostname)}:${defaultPort}`;
  }

  try {
    const apiUrl = new URL(normalizedUrl);
    const frontendIsRemote = !LOOPBACK_HOSTS.has(browserLocation.hostname);

    if (frontendIsRemote && LOOPBACK_HOSTS.has(apiUrl.hostname)) {
      apiUrl.hostname = browserLocation.hostname;
      return apiUrl.toString().replace(/\/+$/, "");
    }
  } catch {
    return normalizedUrl;
  }

  return normalizedUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
