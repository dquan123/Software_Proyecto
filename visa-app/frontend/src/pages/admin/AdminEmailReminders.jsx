import { AlertCircle, CheckCircle2, Loader2, MailCheck, Send } from "lucide-react";
import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader } from "../../components/admin/AdminShared";
import { buildApiUrl } from "../../config/api";

function getToken() {
  return JSON.parse(localStorage.getItem("visaguide_session") || "null")?.token || "";
}

function numberOrZero(value) {
  return Number(value) || 0;
}

function formatReminderType(value) {
  const labels = {
    pending_document: "Documento pendiente",
    upcoming_interview: "Entrevista",
  };
  return labels[value] || value || "Recordatorio";
}

function formatStatus(value, reason) {
  const labels = {
    sent: "Enviado",
    dry_run: "Dry run",
    skipped: reason === "duplicate" ? "Duplicado" : "Omitido",
    failed: "Error",
  };
  return labels[value] || value || "Sin estado";
}

function statusClass(value) {
  if (value === "sent" || value === "dry_run") return "admin-status--approved";
  if (value === "failed") return "admin-status--correction";
  return "admin-status--review";
}

export default function AdminEmailReminders() {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);

  const runReminders = async () => {
    const token = getToken();
    setIsRunning(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/admin/email-reminders/run"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No fue posible ejecutar los recordatorios.");
      setSummary({
        encontrados: numberOrZero(data.encontrados),
        enviados: numberOrZero(data.enviados),
        dryRun: numberOrZero(data.dryRun),
        omitidosDuplicado: numberOrZero(data.omitidosDuplicado),
        errores: numberOrZero(data.errores),
        detalles: Array.isArray(data.detalles) ? data.detalles : [],
      });
    } catch (requestError) {
      setError(requestError.message || "No fue posible ejecutar los recordatorios.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Recordatorios por email"
        description="Ejecuta la búsqueda de documentos pendientes y trámites en etapa de entrevista para enviar o simular recordatorios."
        action={(
          <button className="admin-primary-button" type="button" onClick={runReminders} disabled={isRunning}>
            {isRunning ? <Loader2 className="admin-button-spinner" aria-hidden="true" /> : <Send aria-hidden="true" size={18} />}
            {isRunning ? "Ejecutando..." : "Ejecutar recordatorios"}
          </button>
        )}
      />

      <section className="admin-panel-card admin-reminder-intro">
        <span aria-hidden="true"><MailCheck size={26} /></span>
        <div>
          <h2>Ejecución manual</h2>
          <p>
            Esta acción llama al endpoint administrativo existente y muestra el resumen de la última ejecución.
            En desarrollo puede operar en modo dry run sin enviar correos reales.
          </p>
        </div>
      </section>

      {error && (
        <div className="admin-feedback admin-feedback--error" role="alert">
          <AlertCircle aria-hidden="true" size={18} />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <>
          <section className="admin-summary-grid admin-email-reminders-summary" aria-label="Resumen de última ejecución">
            <article>
              <small>Encontrados</small>
              <strong>{summary.encontrados}</strong>
            </article>
            <article>
              <small>Enviados</small>
              <strong>{summary.enviados}</strong>
            </article>
            <article>
              <small>Dry run</small>
              <strong>{summary.dryRun}</strong>
            </article>
            <article>
              <small>Duplicados</small>
              <strong>{summary.omitidosDuplicado}</strong>
            </article>
            <article>
              <small>Errores</small>
              <strong>{summary.errores}</strong>
            </article>
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-card__header">
              <div>
                <h2>Detalles de ejecución</h2>
                <p>{summary.detalles.length} resultados reportados por el endpoint.</p>
              </div>
              <CheckCircle2 aria-hidden="true" className="admin-reminder-success-icon" />
            </div>

            {summary.detalles.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Destinatario</th>
                      <th>Entidad</th>
                      <th>Estado</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.detalles.map((detail, index) => (
                      <tr key={`${detail.reminderType || "reminder"}-${detail.entityType || "entity"}-${detail.entityId || index}`}>
                        <td>{formatReminderType(detail.reminderType)}</td>
                        <td>{detail.recipientEmail || "Sin correo"}</td>
                        <td>
                          <strong>{detail.entityType || "N/A"}</strong>
                          <small>{detail.entityId || "Sin ID"}</small>
                        </td>
                        <td>
                          <span className={`admin-status ${statusClass(detail.status)}`}>
                            {formatStatus(detail.status, detail.reason)}
                          </span>
                        </td>
                        <td>{detail.error || detail.reason || "Procesado"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state admin-empty-state--compact">
                <strong>Sin detalles</strong>
                <p>El endpoint no devolvió elementos individuales para esta ejecución.</p>
              </div>
            )}
          </section>
        </>
      )}
    </AdminLayout>
  );
}
