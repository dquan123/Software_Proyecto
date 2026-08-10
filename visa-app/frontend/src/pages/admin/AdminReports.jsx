import {
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  CircleCheckBig,
  UsersRound,
} from "lucide-react";
import { createElement, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { buildApiUrl } from "../../config/api";

const reportStats = [
  { key: "totalTramites", label: "Trámites totales", icon: UsersRound, tone: "blue" },
  { key: "progresoPromedio", label: "Progreso promedio", icon: ChartNoAxesColumnIncreasing, tone: "amber", suffix: "%" },
  { key: "completados", label: "Trámites completados", icon: CircleCheckBig, tone: "green" },
  { key: "sinAsignar", label: "Casos sin asignar", icon: BriefcaseBusiness, tone: "red" },
];

function DistributionBars({ items, emptyMessage }) {
  const maximum = Math.max(0, ...items.map((item) => item.total));

  if (!items.length) return <p className="admin-report-empty">{emptyMessage}</p>;

  return (
    <div className="admin-report-bars">
      {items.map((item) => {
        const width = maximum ? Math.max(8, (item.total / maximum) * 100) : 0;
        return (
          <div className="admin-report-bar" key={item.label}>
            <div><span>{item.label || "Sin definir"}</span><strong>{item.total}</strong></div>
            <span className="admin-report-bar__track" aria-hidden="true">
              <span style={{ width: `${width}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30");
  const [revision, setRevision] = useState(0);

  const advisorMaximum = useMemo(
    () => Math.max(0, ...(report?.cargaAsesores || []).map((advisor) => advisor.asignados)),
    [report]
  );

  useEffect(() => {
    const controller = new AbortController();
    const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
    fetch(buildApiUrl(`/admin/metrics/processes?days=${range}`), {
      signal: controller.signal,
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    }).then((response) => {
      if (!response.ok) throw new Error("No fue posible cargar los reportes");
      return response.json();
    }).then((data) => { setReport(data); setError(""); }).catch((requestError) => {
      if (requestError.name !== "AbortError") setError(requestError.message);
    });
    return () => controller.abort();
  }, [range, revision]);

  const exportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `visaguide-reporte-${new Date().toISOString().slice(0, 10)}.json`; link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <section className="admin-hero admin-reports-hero">
        <div>
          <h2>Reportes y Analíticas</h2>
          <p>Estadísticas y métricas globales de la plataforma.</p>
        </div>
        <div className="admin-report-actions"><label><span className="visually-hidden">Rango</span><select value={range} onChange={(event) => setRange(event.target.value)}><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="365">Último año</option></select></label><button className="admin-primary-button" type="button" onClick={exportReport} disabled={!report}>Exportar</button></div>
      </section>

      {error && <div className="admin-report-message" role="alert"><p>{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Reintentar</button></div>}
      {!report && !error && <p className="admin-report-message" role="status">Cargando reportes…</p>}

      {report && (
        <>
          <section className="admin-report-stats" aria-label="Resumen de reportes">
            {reportStats.map(({ key, label, icon, tone, suffix = "" }) => (
              <article className={`admin-report-stat admin-report-stat--${tone}`} key={key}>
                <span>{createElement(icon, { size: 24, strokeWidth: 2, "aria-hidden": true })}</span>
                <div><small>{label}</small><strong>{Math.round(report[key] || 0)}{suffix}</strong></div>
              </article>
            ))}
          </section>

          <div className="admin-report-grid">
            <section className="admin-panel-card admin-report-card">
              <div className="admin-panel-card__header"><h2>Trámites por estado</h2></div>
              <DistributionBars items={report.porEstado || []} emptyMessage="Aún no hay estados registrados." />
            </section>

            <section className="admin-panel-card admin-report-card">
              <div className="admin-panel-card__header"><h2>Distribución por etapa</h2></div>
              <DistributionBars items={report.porEtapa || []} emptyMessage="Aún no hay etapas registradas." />
            </section>
          </div>

          <section className="admin-panel-card admin-report-card admin-report-workload">
            <div className="admin-panel-card__header">
              <div><h2>Carga de trabajo por asesor</h2><p>Trámites asignados y pendientes por integrante.</p></div>
            </div>
            {!(report.cargaAsesores || []).length ? (
              <p className="admin-report-empty">Aún no hay asesores con carga registrada.</p>
            ) : (
              <div className="admin-report-advisors">
                {report.cargaAsesores.map((advisor) => (
                  <article key={advisor.id}>
                    <div><strong>{advisor.nombre}</strong><span>{advisor.pendientes} pendientes</span></div>
                    <span className="admin-report-advisor-track" aria-hidden="true">
                      <span style={{ width: `${advisorMaximum ? Math.max(8, (advisor.asignados / advisorMaximum) * 100) : 0}%` }} />
                    </span>
                    <b>{advisor.asignados}</b>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}
