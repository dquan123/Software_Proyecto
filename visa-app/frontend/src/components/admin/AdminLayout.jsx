import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpenText,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
  UserCircle,
  UserRoundCheck,
  Users,
} from "lucide-react";
import VisaGuideLogo from "../VisaGuideLogo";
import useTheme from "../../hooks/useTheme";
import { useAdminSession } from "./AdminSessionContext";
import useAdminResource from "../../hooks/useAdminResource";
import "../../styles/admin.css";
import "../../styles/admin-prototype.css";

const adminNavItems = [
  { label: "Inicio", path: "/admin", icon: <LayoutDashboard size={20} strokeWidth={2} aria-hidden="true" />, end: true },
  { label: "Todas las solicitudes", path: "/admin/processes", icon: <ClipboardList size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Asesores", path: "/admin/advisors", icon: <BriefcaseBusiness size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Usuarios", path: "/admin/users", icon: <Users size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Asignaciones", path: "/admin/assignments", icon: <UserRoundCheck size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Documentos", path: "/admin/documents", icon: <FileText size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Formularios DS-160", path: "/admin/ds160", icon: <CheckSquare size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Entrevistas", path: "/admin/interviews", icon: <MessageSquareText size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Banco de preguntas", path: "/admin/questions", icon: <BookOpenText size={20} strokeWidth={2} aria-hidden="true" /> },
  { label: "Reportes", path: "/admin/reports", icon: <BarChart3 size={20} strokeWidth={2} aria-hidden="true" /> },
];

const pageTitles = {
  "/admin": "Inicio",
  "/admin/advisors": "Asesores",
  "/admin/users": "Usuarios",
  "/admin/documents": "Documentos",
  "/admin/interviews": "Entrevistas",
  "/admin/processes": "Todas las solicitudes",
  "/admin/assignments": "Asignaciones",
  "/admin/ds160": "Formularios DS-160",
  "/admin/questions": "Banco de preguntas",
  "/admin/profile": "Panel de Administración",
  "/admin/reports": "Reportes",
  "/admin/settings": "Configuración",
};

const ADMIN_SIDEBAR_COLLAPSED_KEY = "vg-admin-sidebar-collapsed";

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/admin/processes/")) return "Todas las solicitudes";
  return "Panel administrador";
}

function getInitialSidebarCollapsed() {
  try {
    return localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function AdminLayout({ children }) {
  const session = useAdminSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const title = getPageTitle(location.pathname);
  const userName = session?.nombre || "Administrador";
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const notificationRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const { data: notificationData, isLoading: notificationsLoading, error: notificationsError, retry: retryNotifications } = useAdminResource(`/notificaciones/${session.id_usuario || session.id}`);
  const notifications = notificationData?.notificaciones || [];

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOutside = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        notificationTriggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeEscape);
    return () => document.removeEventListener("keydown", closeEscape);
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("visaguide_session");
    localStorage.removeItem("correoUsuario");
    localStorage.removeItem("perfilUsuario");
    navigate("/login", { replace: true });
  };

  const handleDesktopSidebarToggle = () => {
    setSidebarCollapsed((isCollapsed) => {
      const nextValue = !isCollapsed;
      try {
        localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(nextValue));
      } catch {
        // Ignore storage failures; the visual state can still update for this session.
      }
      return nextValue;
    });
  };

  return (
    <div className={`admin-shell${sidebarCollapsed ? " admin-shell--sidebar-collapsed" : ""}`}>
      <aside id="admin-navigation" className={`admin-sidebar${sidebarOpen ? " admin-sidebar--open" : ""}${sidebarCollapsed ? " admin-sidebar--collapsed" : ""}`} aria-label="Navegacion del panel administrador">
        <div className="admin-sidebar__top">
          <VisaGuideLogo
            variant="full"
            className="admin-sidebar__brand"
            subtitle="Administrador"
          />
          <button
            type="button"
            className="admin-sidebar__collapse"
            aria-label={sidebarCollapsed ? "Expandir menu administrativo" : "Colapsar menu administrativo"}
            aria-controls="admin-navigation"
            aria-expanded={!sidebarCollapsed}
            data-tooltip={sidebarCollapsed ? "Expandir" : "Colapsar"}
            onClick={handleDesktopSidebarToggle}
          >
            {sidebarCollapsed ? <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" /> : <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" />}
          </button>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Modulos de administracion">
          {adminNavItems.map(({ label, path, icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`
              }
              data-tooltip={label}
              title={sidebarCollapsed ? label : undefined}
              onClick={() => setSidebarOpen(false)}
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
          <NavLink
            className={({ isActive }) =>
              `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`
            }
            to="/admin/settings"
            data-tooltip="Configuración"
            title={sidebarCollapsed ? "Configuración" : undefined}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={20} strokeWidth={2} aria-hidden="true" />
            <span>Configuración</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar__footer">
          <button
            type="button"
            className="admin-sidebar__theme"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            data-tooltip={isDark ? "Modo claro" : "Modo oscuro"}
            title={sidebarCollapsed ? (isDark ? "Modo claro" : "Modo oscuro") : undefined}
          >
            {isDark ? <Sun size={20} strokeWidth={2} aria-hidden="true" /> : <Moon size={20} strokeWidth={2} aria-hidden="true" />}
            <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
          </button>

          <NavLink
            className={({ isActive }) =>
              `admin-sidebar__profile${isActive ? " admin-sidebar__link--active" : ""}`
            }
            to="/admin/profile"
            data-tooltip="Mi perfil"
            title={sidebarCollapsed ? "Mi perfil" : undefined}
            onClick={() => setSidebarOpen(false)}
          >
            <UserCircle size={20} strokeWidth={2} aria-hidden="true" /><span>Mi perfil</span>
          </NavLink>

          <button type="button" className="admin-sidebar__logout" data-tooltip="Cerrar sesion" title={sidebarCollapsed ? "Cerrar sesion" : undefined} onClick={handleLogout}>
            <LogOut size={20} strokeWidth={2} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="admin-sidebar-backdrop" aria-label="Cerrar menú" onClick={() => { setSidebarOpen(false); menuTriggerRef.current?.focus(); }} />}

      <div className="admin-workspace">
        <header className="admin-header">
          <div className="admin-header__title"><button ref={menuTriggerRef} type="button" className="admin-header__menu" aria-label={sidebarOpen ? "Cerrar menú administrativo" : "Abrir menú administrativo"} aria-controls="admin-navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button><h1>{title}</h1></div>
          <div className="admin-header__actions">
            <div className="admin-header__notifications" ref={notificationRef}>
            <button ref={notificationTriggerRef} type="button" className="admin-header__notification" aria-label="Notificaciones" aria-haspopup="true" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>
              <Bell size={22} strokeWidth={2} aria-hidden="true" />
              {notifications.some((item) => !item.leido) && <span aria-hidden="true" />}
            </button>
            {notificationsOpen && <section className="admin-notification-menu" aria-label="Notificaciones administrativas"><header><strong>Notificaciones</strong><button type="button" onClick={() => { setNotificationsOpen(false); notificationTriggerRef.current?.focus(); }} aria-label="Cerrar notificaciones">×</button></header>{notificationsLoading ? <p role="status">Cargando…</p> : notificationsError ? <div role="alert"><p>{notificationsError}</p><button type="button" onClick={retryNotifications}>Reintentar</button></div> : notifications.length ? <ul>{notifications.slice(0, 8).map((item) => <li key={item.id}><strong>{item.titulo}</strong><span>{item.mensaje}</span></li>)}</ul> : <p>Sin notificaciones.</p>}</section>}
            </div>
            <div className="admin-header__user" aria-label="Administrador actual">
            <div>
              <strong>{userName}</strong>
              <small>Global</small>
            </div>
              <span>{userName.slice(0, 2).toUpperCase()}</span>
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
