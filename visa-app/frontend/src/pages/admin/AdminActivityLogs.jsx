import { RefreshCcw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminResourceState } from "../../components/admin/AdminShared";
import { buildApiUrl } from "../../config/api";

function getToken() {
  return JSON.parse(localStorage.getItem("visaguide_session") || "null")?.token || "";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function actorLabel(log) {
  if (log.adminId) return `Admin #${log.adminId}`;
  if (log.userId) return `Usuario #${log.userId}`;
  return "Sistema";
}

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [filters, setFilters] = useState({ action: "", userId: "", role: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const reload = () => {
    setIsLoading(true);
    setError("");
    setRevision((value) => value + 1);
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(pagination.limit));
    params.set("page", String(pagination.page));
    if (filters.action.trim()) params.set("action", filters.action.trim());
    if (filters.userId.trim()) params.set("userId", filters.userId.trim());
    if (filters.role) params.set("role", filters.role);
    return params.toString();
  }, [filters, pagination.limit, pagination.page]);

  useEffect(() => {
    const controller = new AbortController();
    const token = getToken();

    fetch(buildApiUrl(`/admin/activity-logs?${query}`), {
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No fue posible cargar los logs de actividad.");
        return data;
      })
      .then((data) => {
        setLogs(data.logs || []);
        setPagination((current) => ({
          ...current,
          pages: data.pages || 1,
          total: data.total || 0,
        }));
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "No fue posible cargar los logs de actividad.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [query, revision]);

  const updateFilter = (key, value) => {
    setIsLoading(true);
    setError("");
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const changePage = (page) => {
    setIsLoading(true);
    setError("");
    setPagination((current) => ({ ...current, page }));
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Logs de Actividad"
        description="Registro administrativo de acciones importantes realizadas en la plataforma."
        action={(
          <button className="admin-secondary-button" type="button" onClick={reload}>
            <RefreshCcw aria-hidden="true" size={18} />
            Actualizar
          </button>
        )}
      />

      <section className="admin-panel-card">
        <div className="admin-report-actions">
          <label>
            <span>Acción</span>
            <span className="admin-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={filters.action}
                onChange={(event) => updateFilter("action", event.target.value)}
                placeholder="Buscar acción"
              />
            </span>
          </label>
          <label>
            <span>Usuario</span>
            <input
              type="number"
              min="1"
              value={filters.userId}
              onChange={(event) => updateFilter("userId", event.target.value)}
              placeholder="ID"
            />
          </label>
          <label>
            <span>Rol</span>
            <select value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}>
              <option value="">Todos</option>
              <option value="cliente">Cliente</option>
              <option value="asesor">Asesor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
        </div>
      </section>

      <AdminResourceState
        isLoading={isLoading}
        error={error}
        retry={reload}
        isEmpty={!isLoading && !error && logs.length === 0}
        empty="No hay logs de actividad para los filtros seleccionados."
      />

      {!isLoading && !error && logs.length > 0 && (
        <section className="admin-panel-card">
          <div className="admin-panel-card__header">
            <div>
              <h2>Actividad registrada</h2>
              <p>{pagination.total} eventos encontrados.</p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Actor</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <strong>{actorLabel(log)}</strong>
                      <small>{log.userEmail || "Sin correo"}</small>
                    </td>
                    <td><span className="admin-status admin-status--review">{log.action}</span></td>
                    <td>
                      <strong>{log.entityType || "N/A"}</strong>
                      <small>{log.entityId || "Sin ID"}</small>
                    </td>
                    <td>{log.description || "Sin descripción"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="admin-pagination">
            <span>Página {pagination.page} de {pagination.pages}</span>
            <div>
              <button type="button" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)}>Anterior</button>
              <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => changePage(pagination.page + 1)}>Siguiente</button>
            </div>
          </footer>
        </section>
      )}
    </AdminLayout>
  );
}
