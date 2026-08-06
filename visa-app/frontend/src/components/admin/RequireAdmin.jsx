import { Navigate } from "react-router-dom";
import useRequireAuth from "../../hooks/useRequireAuth";
import { AdminSessionProvider } from "./AdminSessionContext";

export default function RequireAdmin({ children }) {
  const { isValidating, session } = useRequireAuth();

  if (isValidating) {
    return <main id="main-content" tabIndex="-1" className="route-loading"><span className="route-loading__spinner" aria-hidden="true" /><span className="visually-hidden" role="status">Validando acceso…</span></main>;
  }

  if (session?.rol !== "admin") {
    return <Navigate to={session?.perfil ? "/dashboard" : "/seleccion-perfil"} replace />;
  }

  return <AdminSessionProvider value={session}>{children}</AdminSessionProvider>;
}
