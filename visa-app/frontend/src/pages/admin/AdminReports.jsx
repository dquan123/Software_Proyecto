import {
  CalendarDays,
  Clock3,
  CircleCheckBig,
  Download,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { createElement, useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminAdvancedFilters from "../../components/admin/AdminAdvancedFilters";
import useAdminResource from "../../hooks/useAdminResource";
import { EMPTY_ADMIN_FILTERS, adminFilterError } from "../../utils/adminFilters";
import { AdminDonutChart, AdminLineChart, AdminVerticalBarChart } from "../../components/admin/AdminCharts";
import { buildApiUrl } from "../../config/api";

const reportStats = [
  { key: "totalActivas", label: "Total activas", icon: UsersRound, tone: "blue" },
  { key: "tiempoPromedioDias", label: "Tiempo promedio", icon: Clock3, tone: "amber", suffix: " días" },
  { key: "revisionesPendientes", label: "Revisiones pend.", icon: TrendingUp, tone: "red" },
  { key: "tasaExito", label: "Tasa de éxito", icon: CircleCheckBig, tone: "green", suffix: "%" },
];

const monthFormatter = new Intl.DateTimeFormat("es-GT", { month: "short" });
const documentLabels = { approved: "Aprobados", review: "En revisión", correction: "Corrección", rejected: "Corrección", pending: "Pendientes" };

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [filters, setFilters] = useState(EMPTY_ADMIN_FILTERS);
  const [status, setStatus] = useState("");
  const advisorResource = useAdminResource("/admin/advisors");
  const dateError = range === "custom" ? adminFilterError({ ...filters, from, to }) : "";

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (filters.advisor) params.set("advisor", filters.advisor);
    if (range === "custom") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    } else if (range !== "all") {
      params.set("days", range);
    }
    return params.toString();
  }, [from, range, to, status, filters.advisor]);

  useEffect(() => {
    const controller = new AbortController();
    const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
    setIsLoading(true);
    setExportMessage("");
    fetch(buildApiUrl(`/admin/metrics/processes${query ? `?${query}` : ""}`), {
      signal: controller.signal,
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible cargar los reportes");
      return data;
    }).then((data) => { setReport(data); setError(""); }).catch((requestError) => {
      if (requestError.name !== "AbortError") setError(requestError.message);
    }).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [query, revision]);

  const selectRange = (value) => {
    setRange(value);
    setExportMessage("");
    if (value === "custom" && (!from || !to)) {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      setFrom(start.toISOString().slice(0, 10));
      setTo(end.toISOString().slice(0, 10));
    }
  };

  const exportReport = async () => {
    setIsExporting(true);
    setExportMessage("");
    try {
      const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
      const response = await fetch(buildApiUrl(`/admin/metrics/processes.xlsx${query ? `?${query}` : ""}`), {
        headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No fue posible exportar el reporte");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `visaguide-reporte-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMessage("Reporte de Excel exportado correctamente.");
    } catch (requestError) {
      setExportMessage(requestError.message || "No fue posible exportar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-hero admin-reports-hero">
        <div>
          <h1>Reportes y Analíticas</h1>
          <p>Estadísticas y métricas globales de la plataforma.</p>
        </div>
        <div className="admin-report-actions"><label><span>Periodo</span><select value={range} onChange={(event) => selectRange(event.target.value)}><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option><option value="365">Último año</option><option value="all">Todo el historial</option><option value="custom">Rango personalizado</option></select></label>{range === "custom" && <div className="admin-report-date-range"><CalendarDays aria-hidden="true" /><label><span>Desde</span><input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></label><label><span>Hasta</span><input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></label></div>}<button className="admin-primary-button admin-primary-button--navy" type="button" onClick={exportReport} disabled={!report || isLoading || Boolean(error) || Boolean(dateError) || isExporting || (range === "custom" && (!from || !to))}><Download aria-hidden="true" />{isExporting ? "Exportando…" : "Exportar Excel"}</button></div>
      </section>
      <AdminAdvancedFilters value={filters} onChange={setFilters} showDates={false} advisors={advisorResource.data?.asesores || []}
        status={status} statuses={[{ value: "", label: "Todos" }, ...["En proceso", "Pendiente", "Aprobado", "Inactivo", "Completado"].map((value) => ({ value, label: value }))]}
        onStatusChange={setStatus} onReset={() => { setFilters(EMPTY_ADMIN_FILTERS); setStatus(""); setFrom(""); setTo(""); setRange("all"); }} />
      <p>El periodo, estado y asesor seleccionan solicitudes por su fecha de creación (UTC); documentos y revisiones pertenecen a esas solicitudes.</p>
      {advisorResource.error && <p role="alert">No se pudieron cargar los asesores. <button type="button" onClick={advisorResource.retry}>Reintentar asesores</button></p>}
      {dateError && <p role="alert">{dateError}</p>}

      {error && <div className="admin-report-message" role="alert"><p>{error}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Reintentar</button></div>}
      {isLoading && !error && <p className="admin-report-message" role="status">Cargando reportes…</p>}
      {exportMessage && <p className="admin-report-message admin-report-message--compact" role="status">{exportMessage}</p>}

      {report && !isLoading && !error && !dateError && (
        <>
          <section className="admin-report-stats" aria-label="Resumen de reportes">
            {reportStats.map(({ key, label, icon, tone, suffix = "" }) => (
              <article className={`admin-report-stat admin-report-stat--${tone}`} key={key}>
                <span>{createElement(icon, { size: 24, strokeWidth: 2, "aria-hidden": true })}</span>
                <div><strong>{Math.round(report[key] || 0)}{suffix}</strong><small>{label}</small></div>
              </article>
            ))}
          </section>

          <div className="admin-report-grid">
            <section className="admin-panel-card admin-report-card">
              <div className="admin-panel-card__header"><h2>Nuevas solicitudes por mes</h2></div>
              <AdminLineChart items={(report.nuevasSolicitudes || []).map((item) => ({ ...item, label: monthFormatter.format(new Date(`${item.label}-02T00:00:00`)).replace(".", "") }))} />
            </section>

            <section className="admin-panel-card admin-report-card">
              <div className="admin-panel-card__header"><h2>Solicitudes por etapa</h2></div>
              <AdminVerticalBarChart items={report.porEtapa || []} />
            </section>
          </div>

          <section className="admin-panel-card admin-report-card admin-report-documents">
            <div className="admin-panel-card__header"><div><h2>Estado de Documentos</h2><p>Distribución porcentual de la revisión documental actual.</p></div></div>
            <AdminDonutChart items={(report.documentosPorEstado || []).map((item) => ({ ...item, label: documentLabels[item.label] || item.label }))} />
          </section>
        </>
      )}
    </AdminLayout>
  );
}
