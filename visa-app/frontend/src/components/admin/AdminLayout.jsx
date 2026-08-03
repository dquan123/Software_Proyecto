import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  Users,
} from "lucide-react";
import VisaGuideLogo from "../VisaGuideLogo";
import useRequireAuth from "../../hooks/useRequireAuth";
import "../../styles/admin.css";

const adminNavItems = [
  { label: "Dashboard", path: "/admin", icon: <LayoutDashboard size={20} strokeWidth={2} aria-hidden="true" />, end: true },
  { label: "Usuarios", path: "/admin/users", icon: <Users size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Documentos", path: "/admin/documents", icon: <FileText size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Entrevistas", path: "/admin/interviews", icon: <MessageSquareText size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Tramites", path: "/admin/processes", icon: <ClipboardList size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Reportes", path: "/admin/reports", icon: <BarChart3 size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Configuracion", path: "/admin/settings", icon: <Settings size={20} strokeWidth={2} aria-hidden="true" /> },
];

const pageTitles = {
  "/admin": "Dashboard",
  "/admin/users": "Usuarios",
  "/admin/documents": "Documentos",
  "/admin/interviews": "Entrevistas",
  "/admin/processes": "Tramites",
  "/admin/reports": "Reportes",
  "/admin/settings": "Configuracion",
};

export default function AdminLayout({ children }) {
  const { isValidating, session } = useRequireAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || "Panel administrador";
  const userName = session?.nombre || "Administrador";

  const handleLogout = () => {
    localStorage.removeItem("visaguide_session");
    localStorage.removeItem("correoUsuario");
    localStorage.removeItem("perfilUsuario");
    navigate("/login", { replace: true });
  };

  if (isValidating) {
    return (
      <main id="main-content" tabIndex="-1" className="route-loading">
        <span className="route-loading__spinner" aria-hidden="true" />
        <span className="visually-hidden" role="status" aria-live="polite">
          Cargando panel administrador...
        </span>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Navegacion del panel administrador">
        <VisaGuideLogo
          variant="full"
          className="admin-sidebar__brand"
          subtitle="Panel administrador"
        />

        <nav className="admin-sidebar__nav" aria-label="Modulos de administracion">
          {adminNavItems.map(({ label, path, icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`
              }
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
          <LogOut size={20} strokeWidth={2} aria-hidden="true" />
          <span>Cerrar sesion</span>
        </button>
      </aside>

      <div className="admin-workspace">
        <header className="admin-header">
          <div>
            <p className="admin-header__eyebrow">Sprint 6</p>
            <h1>{title}</h1>
          </div>
          <div className="admin-header__user" aria-label="Administrador actual">
            <span>{userName.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{userName}</strong>
              <small>{session?.correo || "Sesion administrativa"}</small>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex="-1" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
