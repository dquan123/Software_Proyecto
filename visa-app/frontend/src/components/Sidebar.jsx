import { useState, useEffect } from "react";
import useTheme from "../hooks/useTheme";

export default function Sidebar({ currentPage }) {
  const [modoSenior, setModoSenior] = useState(
    () => localStorage.getItem("modoSenior") === "true"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const [usuario] = useState(() => {
    const session = localStorage.getItem("visaguide_session");
    if (session) {
      try { return JSON.parse(session); } catch { return null; }
    }
    return null;
  });

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggleModoSenior = () => {
    const next = !modoSenior;
    setModoSenior(next);
    localStorage.setItem("modoSenior", next.toString());
    window.dispatchEvent(new CustomEvent("modoSeniorChange", { detail: next }));
  };

  const menuItems = [
    { id: "inicio",        label: "Inicio",           icon: "grid",    path: "/dashboard" },
    { id: "informacion",   label: "Información",       icon: "info",    path: "/informacion" },
    { id: "ds160",         label: "DS-160",            icon: "file",    path: "/ds160" },
    { id: "cronologia",    label: "Cronología",        icon: "clock",   path: "/cronologia" },
    { id: "documentos",    label: "Documentos",        icon: "folder",  path: "/documents" },
    { id: "entrevista",    label: "Entrevista",        icon: "users",   path: "/entrevista" },
    { id: "notificaciones",label: "Notificaciones",    icon: "bell",    path: "/notificaciones", badge: 3 },
    { id: "perfil",        label: "Perfil",            icon: "user",    path: "/perfil" },
    { id: "chat",          label: "Chat con asesor",   icon: "message", path: "/chat" },
  ];

  const icons = {
    grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    info: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg>,
    file: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    clock: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
    folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    message: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    sun: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  };

  const getInitials = (nombre) => {
    if (!nombre) return "US";
    const parts = nombre.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : nombre.substring(0, 2).toUpperCase();
  };

  const getPerfilLabel = (perfil) => {
    const map = {
      turismo_negocios: "Solicitante B1/B2",
      estudiante: "Estudiante F/M",
      renovacion: "Renovación",
      grupo_familiar: "Grupo Familiar",
      adulto_mayor: "Adulto Mayor",
    };
    return map[perfil] || "Solicitante";
  };

  const sidebarStyle = {
    ...s.sidebar,
    transform: mobileOpen ? "translateX(0)" : undefined,
  };

  return (
    <>
      {/* ─── Mobile hamburger button ─── */}
      <button
        className="vg-hamburger"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="vg-hamburger-bar"
            style={
              mobileOpen
                ? i === 0
                  ? { transform: "translateY(7px) rotate(45deg)" }
                  : i === 1
                  ? { opacity: 0 }
                  : { transform: "translateY(-7px) rotate(-45deg)" }
                : undefined
            }
          />
        ))}
      </button>

      {/* ─── Mobile backdrop ─── */}
      {mobileOpen && (
        <div
          className="vg-sidebar-backdrop"
          style={{ display: "block" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside style={sidebarStyle}>
        {/* Logo */}
        <div style={s.logoContainer}>
          <div style={s.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <span style={s.logoText}>
            Visa<span style={s.logoTextAccent}>Guide</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={s.nav}>
          <p style={s.menuLabel}>MENÚ PRINCIPAL</p>
          <ul style={s.menuList}>
            {menuItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.path}
                    style={{ ...s.menuItem, ...(isActive ? s.menuItemActive : {}) }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span style={s.menuIcon}>{icons[item.icon]}</span>
                    <span style={{ ...s.menuText, fontSize: modoSenior ? "17px" : "14px" }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={s.badge}>{item.badge}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div style={s.bottomSection}>
          {/* Dark mode toggle */}
          <div style={s.themeRow}>
            <div style={s.themeLeft}>
              <span style={s.themeIcon}>{isDark ? icons.moon : icons.sun}</span>
              <span style={{ ...s.themeText, fontSize: modoSenior ? "17px" : "14px" }}>
                {isDark ? "Modo oscuro" : "Modo claro"}
              </span>
            </div>
            <button
              style={{ ...s.toggle, ...(isDark ? s.toggleActive : {}) }}
              onClick={toggleTheme}
              aria-label="Cambiar tema"
            >
              <span style={{ ...s.toggleCircle, ...(isDark ? s.toggleCircleActive : {}) }} />
            </button>
          </div>

          {/* Modo Senior */}
          <div style={s.modoSenior}>
            <div style={s.modoSeniorLeft}>
              <span style={s.modoSeniorIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>
                </svg>
              </span>
              <span style={{ ...s.modoSeniorText, fontSize: modoSenior ? "17px" : "14px" }}>
                Modo Senior
              </span>
            </div>
            <button
              style={{ ...s.toggle, ...(modoSenior ? s.toggleActive : {}) }}
              onClick={toggleModoSenior}
            >
              <span style={{ ...s.toggleCircle, ...(modoSenior ? s.toggleCircleActive : {}) }} />
            </button>
          </div>

          {/* User */}
          <div style={s.userSection}>
            <div style={s.userAvatar}>{getInitials(usuario?.nombre)}</div>
            <div style={s.userInfo}>
              <p style={{ ...s.userName, fontSize: modoSenior ? "17px" : "14px" }}>
                {usuario?.nombre || "Usuario"}
              </p>
              <p style={{ ...s.userRole, fontSize: modoSenior ? "15px" : "12px" }}>
                {getPerfilLabel(usuario?.perfil)}
              </p>
            </div>
          </div>

          <button
            style={s.logoutBtn}
            onClick={() => {
              localStorage.removeItem("visaguide_session");
              localStorage.removeItem("correoUsuario");
              localStorage.removeItem("perfilUsuario");
              window.location.href = "/";
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

const s = {
  sidebar: {
    width: "250px",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Segoe UI', sans-serif",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    overflowY: "auto",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
    // Mobile: hidden by default (CSS handles transform via media query)
  },
  logoContainer: { display:"flex", alignItems:"center", gap:"10px", padding:"20px 20px 28px" },
  logoIcon: { width:"36px", height:"36px", backgroundColor:"#dc2649", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center" },
  logoText: { fontSize:"20px", fontWeight:"600", color:"white" },
  logoTextAccent: { color:"#dc2649" },

  nav: { flex:1, padding:"0 12px" },
  menuLabel: { fontSize:"11px", fontWeight:"600", color:"#64748b", letterSpacing:"0.5px", padding:"0 12px", marginBottom:"12px" },
  menuList: { listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:"4px" },
  menuItem: { display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", borderRadius:"10px", color:"#94a3b8", textDecoration:"none", fontSize:"14px", fontWeight:"500", transition:"all 0.15s ease" },
  menuItemActive: { backgroundColor:"#dc2649", color:"white" },
  menuIcon: { display:"flex", alignItems:"center", justifyContent:"center", width:"20px", height:"20px", flexShrink:0 },
  menuText: { flex:1 },
  badge: { backgroundColor:"#dc2649", color:"white", fontSize:"11px", fontWeight:"600", padding:"2px 8px", borderRadius:"10px", minWidth:"20px", textAlign:"center" },

  bottomSection: { padding:"14px", borderTop:"1px solid #1e293b", marginTop:"auto" },

  themeRow: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 8px", marginBottom:"4px" },
  themeLeft: { display:"flex", alignItems:"center", gap:"10px" },
  themeIcon: { color:"#94a3b8", display:"flex", alignItems:"center" },
  themeText: { color:"#94a3b8", fontWeight:"500" },

  modoSenior: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 8px", marginBottom:"12px" },
  modoSeniorLeft: { display:"flex", alignItems:"center", gap:"10px" },
  modoSeniorIcon: { color:"#94a3b8", display:"flex", alignItems:"center" },
  modoSeniorText: { color:"#94a3b8", fontWeight:"500" },

  toggle: { width:"44px", height:"24px", backgroundColor:"#334155", borderRadius:"12px", border:"none", cursor:"pointer", position:"relative", transition:"background-color 0.2s ease", padding:0 },
  toggleActive: { backgroundColor:"#dc2649" },
  toggleCircle: { position:"absolute", top:"3px", left:"3px", width:"18px", height:"18px", backgroundColor:"white", borderRadius:"50%", transition:"left 0.2s ease" },
  toggleCircleActive: { left:"23px" },

  userSection: { display:"flex", alignItems:"center", gap:"12px", padding:"8px" },
  userAvatar: { width:"40px", height:"40px", backgroundColor:"#334155", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"14px", fontWeight:"600" },
  userInfo: { flex:1 },
  userName: { color:"white", fontWeight:"600", margin:0 },
  userRole: { color:"#64748b", margin:"2px 0 0 0" },
  logoutBtn: { width:"100%", padding:"10px", marginTop:"10px", backgroundColor:"transparent", border:"1px solid #334155", borderRadius:"8px", color:"#94a3b8", fontSize:"13px", cursor:"pointer", fontFamily:"'Segoe UI', sans-serif" },
};

/* Apply mobile CSS overrides via a style injection */
if (typeof document !== "undefined") {
  if (!document.getElementById("vg-sidebar-mobile-css")) {
    const style = document.createElement("style");
    style.id = "vg-sidebar-mobile-css";
    style.textContent = `
      @media (max-width: 768px) {
        aside[style*="width: 250px"] {
          transform: translateX(-100%);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
