import { Navigate } from "react-router-dom";
import useRequireAuth from "../hooks/useRequireAuth";

export default function RequireStaff({ children }) {
  const { isValidating, session } = useRequireAuth();
  if (isValidating) return <main id="main-content" tabIndex="-1" className="route-loading"><span className="route-loading__spinner" aria-hidden="true" /><span className="visually-hidden" role="status">Validando acceso…</span></main>;
  if (!new Set(["asesor", "admin"]).has(session?.rol)) return <Navigate to="/dashboard" replace />;
  return children;
}
