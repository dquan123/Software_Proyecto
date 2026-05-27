import "../styles/skeleton.css";

export function Skeleton({ width = "100%", height = "16px", radius = "8px", className = "", style = {} }) {
  return (
    <span
      className={`vg-skel ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, lastWidth = "60%", gap = 10, lineHeight = "12px" }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: `${gap}px`, width: "100%" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={lineHeight} width={i === lines - 1 ? lastWidth : "100%"} />
      ))}
    </span>
  );
}

export function SkeletonCircle({ size = 40 }) {
  return <Skeleton width={`${size}px`} height={`${size}px`} radius="50%" style={{ flexShrink: 0 }} />;
}

function SkeletonShell({ children }) {
  return (
    <div className="vg-skel-shell">
      <aside className="vg-skel-sidebar" aria-hidden="true">
        <div className="vg-skel-sidebar__logo">
          <Skeleton width="36px" height="36px" radius="8px" />
          <Skeleton width="110px" height="20px" />
        </div>
        <div className="vg-skel-sidebar__menu">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="vg-skel-sidebar__row">
              <Skeleton width="18px" height="18px" radius="4px" />
              <Skeleton width={`${55 + ((i * 11) % 30)}%`} height="13px" />
            </div>
          ))}
        </div>
        <div className="vg-skel-sidebar__user">
          <SkeletonCircle size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="80%" height="13px" />
            <div style={{ marginTop: 6 }}>
              <Skeleton width="55%" height="11px" />
            </div>
          </div>
        </div>
      </aside>
      <main className="vg-skel-main">{children}</main>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <SkeletonShell>
      <Skeleton width="260px" height="32px" radius="6px" />
      <div style={{ marginTop: 10, marginBottom: 28 }}>
        <Skeleton width="220px" height="14px" />
      </div>

      <div className="vg-skel-row-card" style={{ marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <Skeleton width="180px" height="18px" />
          <div style={{ marginTop: 8, marginBottom: 24 }}>
            <Skeleton width="280px" height="12px" />
          </div>
          <div className="vg-skel-timeline-h">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="vg-skel-timeline-h__node">
                <SkeletonCircle size={34} />
                <div style={{ marginTop: 8 }}>
                  <Skeleton width="50px" height="10px" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="vg-skel-dark-box">
          <Skeleton width="80px" height="10px" />
          <div style={{ marginTop: 12 }}>
            <Skeleton width="60px" height="40px" />
          </div>
          <div style={{ marginTop: 12 }}>
            <SkeletonCircle size={58} />
          </div>
        </div>
      </div>

      <div className="vg-skel-action-card" style={{ marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <Skeleton width="120px" height="18px" radius="6px" />
          <div style={{ marginTop: 12 }}>
            <Skeleton width="320px" height="22px" />
          </div>
          <div style={{ marginTop: 12 }}>
            <SkeletonText lines={2} lastWidth="70%" />
          </div>
        </div>
        <Skeleton width="170px" height="48px" radius="30px" />
      </div>

      <div className="vg-skel-grid-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="vg-skel-block-card">
            <Skeleton width="36px" height="36px" radius="10px" />
            <div style={{ marginTop: 14 }}>
              <Skeleton width="80%" height="18px" />
            </div>
            <div style={{ marginTop: 12 }}>
              <SkeletonText lines={2} lastWidth="60%" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonShell>
  );
}

export function SkeletonDocuments() {
  return (
    <SkeletonShell>
      <Skeleton width="340px" height="38px" radius="6px" />
      <div style={{ marginTop: 12, marginBottom: 32 }}>
        <Skeleton width="500px" height="16px" />
      </div>

      <div className="vg-skel-grid-4" style={{ marginBottom: 32 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="vg-skel-stat-card">
            <Skeleton width="60px" height="36px" radius="6px" />
            <div style={{ marginTop: 12 }}>
              <Skeleton width="80px" height="11px" />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="vg-skel-doc-card">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="60%" height="22px" />
              <div style={{ marginTop: 12 }}>
                <Skeleton width="40%" height="14px" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Skeleton width="140px" height="44px" radius="14px" />
              <Skeleton width="120px" height="44px" radius="14px" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonShell>
  );
}

export function SkeletonCronologia() {
  return (
    <SkeletonShell>
      <Skeleton width="400px" height="36px" radius="6px" />
      <div style={{ marginTop: 14, marginBottom: 36 }}>
        <Skeleton width="560px" height="14px" />
      </div>

      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="vg-skel-timeline-row">
          <SkeletonCircle size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="40%" height="20px" />
            <div style={{ marginTop: 10 }}>
              <SkeletonText lines={2} lastWidth="80%" />
            </div>
          </div>
        </div>
      ))}
    </SkeletonShell>
  );
}

export function SkeletonChat() {
  return (
    <SkeletonShell>
      <div className="vg-skel-chat">
        <div className="vg-skel-chat__card">
          <div className="vg-skel-chat__header">
            <SkeletonCircle size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="140px" height="16px" style={{ background: "rgba(255,255,255,0.18)" }} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width="200px" height="11px" style={{ background: "rgba(255,255,255,0.12)" }} />
              </div>
            </div>
          </div>
          <div className="vg-skel-chat__messages">
            {[
              { side: "left", w: 70 },
              { side: "left", w: 60 },
              { side: "right", w: 55 },
              { side: "left", w: 75 },
            ].map((m, i) => (
              <div key={i} className={`vg-skel-bubble vg-skel-bubble--${m.side}`}>
                <SkeletonText lines={2} lastWidth={`${m.w}%`} />
              </div>
            ))}
          </div>
          <div className="vg-skel-chat__composer">
            <Skeleton width="100%" height="52px" radius="16px" />
          </div>
        </div>

        <aside className="vg-skel-chat__side">
          <Skeleton width="60%" height="12px" />
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton width="40%" height="11px" />
                <div style={{ marginTop: 8 }}>
                  <Skeleton width="80%" height="16px" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </SkeletonShell>
  );
}

export function SkeletonPerfil() {
  return (
    <SkeletonShell>
      <Skeleton width="280px" height="36px" radius="6px" />
      <div style={{ marginTop: 12, marginBottom: 36 }}>
        <Skeleton width="420px" height="16px" />
      </div>

      <div className="vg-skel-perfil-grid">
        <div className="vg-skel-perfil-card">
          <div className="vg-skel-perfil-card__top" />
          <div className="vg-skel-perfil-card__body">
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <Skeleton width="70%" height="22px" style={{ display: "inline-block" }} />
              <div style={{ marginTop: 8 }}>
                <Skeleton width="50%" height="13px" style={{ display: "inline-block" }} />
              </div>
            </div>
            <SkeletonText lines={3} lastWidth="60%" gap={14} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="vg-skel-block-card" style={{ minHeight: 220 }}>
            <Skeleton width="40%" height="18px" />
            <div style={{ marginTop: 18 }}>
              <SkeletonText lines={4} lastWidth="50%" gap={14} />
            </div>
          </div>
          <div className="vg-skel-block-card" style={{ minHeight: 180 }}>
            <Skeleton width="50%" height="18px" />
            <div style={{ marginTop: 18 }}>
              <SkeletonText lines={3} lastWidth="40%" gap={14} />
            </div>
          </div>
        </div>
      </div>
    </SkeletonShell>
  );
}
