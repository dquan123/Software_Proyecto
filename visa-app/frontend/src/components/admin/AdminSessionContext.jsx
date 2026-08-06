import { createContext, useContext } from "react";

const AdminSessionContext = createContext(null);

export const AdminSessionProvider = AdminSessionContext.Provider;

export function useAdminSession() {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error("useAdminSession debe usarse dentro de RequireAdmin");
  return session;
}
