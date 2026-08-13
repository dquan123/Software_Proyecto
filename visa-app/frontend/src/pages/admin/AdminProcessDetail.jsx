import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  ClipboardCheck,
  ExternalLink,
  FileText,
  MessageSquareText,
  UserRound,
} from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AdminPageHeader, AdminResourceState } from "../../components/admin/AdminShared";
import { buildApiUrl } from "../../config/api";
import { getAdminHeaders } from "../../utils/adminHeaders";
import { openDocumentPreview } from "../../utils/documentPreview";

const documentStatusLabels = {
  approved: "Aprobado",
  review: "En revision",
  rejected: "Rechazado",
  correction: "Correccion",
  pending: "Pendiente",
};

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status) {
  if (status === "Aprobado" || status === "Completado" || status === "approved" || status === "reviewed") return "approved";
  if (status === "Pendiente" || status === "review" || status === "pending") return "review";
  if (status === "Inactivo" || status === "correction" || status === "rejected") return "correction";
  return "pending";
}

function getDocumentStatusLabel(status) {
  return documentStatusLabels[status] || status || "Pendiente";
}

function getRecordedCount(session) {
  return (session.responses || []).filter((response) => response.recorded).length;
}

function getLatestInterviewFeedback(sessions) {
  return sessions.find((session) => session.feedback)?.feedback || "";
}

export default function AdminProcessDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const loadDetail = useCallback((signal) => {
    setIsLoading(true);
    setError("");

    return fetch(buildApiUrl(`/admin/processes/${id}`), {
      signal,
      headers: getAdminHeaders(),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "No fue posible cargar el detalle de la solicitud.");
        return data;
      })
      .then((data) => setDetail(data))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "No fue posible cargar el detalle de la solicitud.");
        }
      })
      .finally(() => {
        if (!signal?.aborted) setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    loadDetail(controller.signal);
    return () => controller.abort();
  }, [loadDetail, revision]);

  const summary = useMemo(() => {
    if (!detail) return null;
    const approvedDocuments = detail.documentos.filter((document) => document.estado === "approved").length;
    const reviewedInterviews = detail.entrevistas.filter((session) => session.status === "reviewed").length;

    return {
      documents: `${approvedDocuments}/${detail.documentos.length}`,
      interviews: `${reviewedInterviews}/${detail.entrevistas.length}`,
      notifications: detail.notificaciones.filter((notification) => !notification.leido).length,
    };
  }, [detail]);

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Detalle de Solicitud"
        description="Vista consolidada del solicitante, tramite y modulos de revision."
        action={<Link className="admin-secondary-button" to="/admin/processes"><ArrowLeft aria-hidden="true" size={18} />Volver</Link>}
      />

      <AdminResourceState
        isLoading={isLoading}
        error={error}
        retry={() => setRevision((value) => value + 1)}
        isEmpty={!isLoading && !error && !detail}
        empty="No se encontro la solicitud."
      />

      {!isLoading && !error && detail && (
        <>
          <section className="admin-request-hero">
            <div className="admin-request-identity">
              <span className="admin-section-kicker">Solicitud #{detail.tramite.id}</span>
              <h2>{detail.solicitante.nombre}</h2>
              <p>{detail.solicitante.correo}</p>
              <div>
                <span className={`admin-status admin-status--${statusClass(detail.tramite.estado)}`}>{detail.tramite.estado}</span>
                <span>{detail.solicitante.perfil}</span>
              </div>
            </div>
            <div className="admin-request-progress" aria-label="Progreso del tramite">
              <strong>{detail.tramite.progreso}%</strong>
              <span><i style={{ width: `${Math.min(100, Math.max(0, detail.tramite.progreso))}%` }} /></span>
              <p>{detail.tramite.etapaActual}</p>
            </div>
          </section>

          <section className="admin-summary-grid" aria-label="Resumen de la solicitud">
            <article><small>Documentos aprobados</small><strong>{summary.documents}</strong></article>
            <article><small>Entrevistas revisadas</small><strong>{summary.interviews}</strong></article>
            <article><small>Notificaciones sin leer</small><strong>{summary.notifications}</strong></article>
            <article><small>Asesor asignado</small><strong>{detail.tramite.asesor?.nombre || "Sin asignar"}</strong></article>
          </section>

          <div className="admin-request-layout">
            <section className="admin-panel-card">
              <div className="admin-panel-card__header">
                <div>
                  <h2><UserRound aria-hidden="true" size={22} /> Solicitante</h2>
                  <p>Datos principales del usuario y del tramite.</p>
                </div>
              </div>
              <dl className="admin-request-details">
                <div><dt>Nombre completo</dt><dd>{detail.solicitante.nombre}</dd></div>
                <div><dt>Correo</dt><dd>{detail.solicitante.correo}</dd></div>
                <div><dt>Tipo de visa</dt><dd>{detail.solicitante.perfil}</dd></div>
                <div><dt>Estado del tramite</dt><dd>{detail.tramite.estado}</dd></div>
                <div><dt>Etapa actual</dt><dd>{detail.tramite.etapaActual}</dd></div>
                <div><dt>Asesor asignado</dt><dd>{detail.tramite.asesor?.nombre || "Sin asignar"}</dd></div>
                <div><dt>Fecha de creacion</dt><dd>{formatDate(detail.tramite.createdAt || detail.solicitante.createdAt)}</dd></div>
              </dl>
            </section>

            <section className="admin-panel-card">
              <div className="admin-panel-card__header">
                <div>
                  <h2><ClipboardCheck aria-hidden="true" size={22} /> DS-160</h2>
                  <p>Resumen del formulario guardado.</p>
                </div>
                <Link className="admin-secondary-button" to="/admin/ds160">Abrir modulo</Link>
              </div>
              {detail.ds160 ? (
                <>
                  <div className="admin-request-progress admin-request-progress--compact">
                    <strong>{detail.ds160.progreso}%</strong>
                    <span><i style={{ width: `${detail.ds160.progreso}%` }} /></span>
                    <p>{detail.ds160.completado ? "Formulario completado" : `Seccion ${detail.ds160.seccionActual} en progreso`}</p>
                  </div>
                  <dl className="admin-request-mini-list">
                    {detail.ds160.resumen.length ? detail.ds160.resumen.map((item) => (
                      <div key={item.key}><dt>{item.label}</dt><dd>{item.value}</dd></div>
                    )) : <div><dt>Resumen</dt><dd>Sin campos relevantes capturados todavia.</dd></div>}
                  </dl>
                </>
              ) : (
                <div className="admin-empty-state admin-empty-state--compact"><strong>Sin formulario DS-160</strong></div>
              )}
            </section>
          </div>

          <section className="admin-panel-card">
            <div className="admin-panel-card__header">
              <div>
                <h2><FileText aria-hidden="true" size={22} /> Documentos</h2>
                <p>Documentos asociados a esta solicitud.</p>
              </div>
              <Link className="admin-secondary-button" to="/admin/documents">Ver documentos</Link>
            </div>
            {detail.documentos.length ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Nombre</th><th>Estado</th><th>Observaciones</th><th>Archivo</th></tr></thead>
                  <tbody>
                    {detail.documentos.map((document) => (
                      <tr key={document.id}>
                        <td><strong>{document.nombre}</strong><small>{document.documento_key || document.tipo || "Documento"}</small></td>
                        <td><span className={`admin-status admin-status--${statusClass(document.estado)}`}>{getDocumentStatusLabel(document.estado)}</span></td>
                        <td>{document.feedback || "Sin observaciones"}</td>
                        <td><button className="admin-action-button" type="button" disabled={!document.archivo_url} onClick={() => openDocumentPreview(document)}><ExternalLink aria-hidden="true" size={15} />Ver documento</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state admin-empty-state--compact"><strong>Sin documentos registrados</strong></div>
            )}
          </section>

          <section className="admin-panel-card">
            <div className="admin-panel-card__header">
              <div>
                <h2><BriefcaseBusiness aria-hidden="true" size={22} /> Entrevistas</h2>
                <p>Sesiones realizadas desde el simulador.</p>
              </div>
              <Link className="admin-secondary-button" to="/admin/interviews">Revisar entrevistas</Link>
            </div>
            {detail.entrevistas.length ? (
              <div className="admin-request-interviews">
                {detail.entrevistas.map((session) => (
                  <article key={session.id}>
                    <header>
                      <div>
                        <strong>{formatDate(session.created_at)}</strong>
                        <span>{getRecordedCount(session)} de {(session.responses || []).length} respuestas grabadas</span>
                      </div>
                      <span className={`admin-status admin-status--${statusClass(session.status)}`}>{session.status === "reviewed" ? "Retroalimentada" : "Pendiente"}</span>
                    </header>
                    <dl>
                      <div><dt>Calificacion</dt><dd>{session.rating || "Sin calificacion"}</dd></div>
                      <div><dt>Feedback</dt><dd>{session.feedback || "Sin feedback"}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state admin-empty-state--compact"><strong>Sin entrevistas registradas</strong></div>
            )}
          </section>

          <div className="admin-request-layout">
            <section className="admin-panel-card">
              <div className="admin-panel-card__header">
                <div>
                  <h2><Bell aria-hidden="true" size={22} /> Notificaciones</h2>
                  <p>Ultimos avisos asociados al usuario.</p>
                </div>
              </div>
              {detail.notificaciones.length ? (
                <ol className="admin-activity-list">
                  {detail.notificaciones.map((notification) => (
                    <li key={notification.id}>
                      <strong>{notification.titulo}</strong>
                      <span>{notification.mensaje}</span>
                      <small>{formatDate(notification.createdAt)}</small>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="admin-empty-state admin-empty-state--compact"><strong>Sin notificaciones recientes</strong></div>
              )}
            </section>

            <section className="admin-panel-card">
              <div className="admin-panel-card__header">
                <div>
                  <h2><MessageSquareText aria-hidden="true" size={22} /> Acciones</h2>
                  <p>Accesos directos a modulos administrativos.</p>
                </div>
              </div>
              <div className="admin-request-actions">
                <Link className="admin-primary-button" to="/admin/processes">Gestionar tramite</Link>
                <Link className="admin-secondary-button" to="/admin/documents">Ver documentos</Link>
                <Link className="admin-secondary-button" to="/admin/interviews">Revisar entrevistas</Link>
                <Link className="admin-secondary-button" to="/admin/ds160">Abrir DS-160</Link>
              </div>
              {getLatestInterviewFeedback(detail.entrevistas) && (
                <p className="admin-request-note">{getLatestInterviewFeedback(detail.entrevistas)}</p>
              )}
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
