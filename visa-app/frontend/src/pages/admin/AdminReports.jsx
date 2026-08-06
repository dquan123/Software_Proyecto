import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { buildApiUrl } from "../../config/api";

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const session = JSON.parse(localStorage.getItem("visaguide_session") || "null");
    fetch(buildApiUrl("/admin/metrics/processes"), {
      signal: controller.signal,
      headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
    }).then((response) => {
      if (!response.ok) throw new Error("No fue posible cargar los reportes");
      return response.json();
    }).then(setReport).catch((requestError) => {
      if (requestError.name !== "AbortError") setError(requestError.message);
    });
    return () => controller.abort();
  }, []);

  return (
    <AdminLayout>
      <section className="admin-panel-card">
        <p className="admin-section-kicker">Reportes</p>
        <h2>Resumen de trámites</h2>
        {error && <p role="alert">{error}</p>}
        {!report && !error && <p role="status">Cargando reportes…</p>}
        {report && <>
          <p><strong>{Math.round(report.progresoPromedio)}%</strong> de progreso promedio</p>
          <h3>Por estado</h3>
          <ul>{(report.porEstado || []).map((item) => <li key={item.label}>{item.label}: {item.total}</li>)}</ul>
          <h3>Por etapa</h3>
          <ul>{(report.porEtapa || []).map((item) => <li key={item.label}>{item.label}: {item.total}</li>)}</ul>
        </>}
      </section>
    </AdminLayout>
  );
}
