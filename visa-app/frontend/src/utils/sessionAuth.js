export function getSessionToken() {
  try {
    return JSON.parse(localStorage.getItem("visaguide_session") || "null")?.token || "";
  } catch {
    return "";
  }
}

export function buildSessionHeaders(extraHeaders = {}) {
  const token = getSessionToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
