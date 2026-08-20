export function getAdminHeaders(json = false) {
  const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");

  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
  };
}

export function getAdminUserId() {
  const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
  return session?.id ?? null;
}
