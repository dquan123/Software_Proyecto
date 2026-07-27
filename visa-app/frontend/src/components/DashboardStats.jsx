import { FileCheck2, FileText, Route } from "lucide-react";

export default function DashboardStats({ loading, error, stats }) {
  if (loading) {
    return (
      <section className="dash-stats" aria-labelledby="dash-stats-title">
        <h2 id="dash-stats-title">Tus estadísticas</h2>
        <p className="dash-stats__status" role="status">Cargando estadísticas...</p>
      </section>
    );
  }

  const ds160Percentage = Math.min(100, Math.max(0, Number(stats?.ds160Percentage) || 0));
  const documentCount = Math.max(0, Number(stats?.documentCount) || 0);
  const currentStage = stats?.currentStage || "Trámite no iniciado";

  return (
    <section className="dash-stats" aria-labelledby="dash-stats-title">
      <div className="dash-stats__heading">
        <div>
          <h2 id="dash-stats-title">Tus estadísticas</h2>
          <p>Resumen actualizado con la información guardada en tu cuenta.</p>
        </div>
        {error && <p className="dash-stats__error" role="alert">{error}</p>}
      </div>

      <div className="dash-stats__grid">
        <article className="dash-stat-card">
          <span className="dash-stat-card__icon" aria-hidden="true"><FileText size={20} /></span>
          <span className="dash-stat-card__label">DS-160 completado</span>
          <strong className="dash-stat-card__value">{ds160Percentage}%</strong>
          <div
            className="dash-stat-card__progress"
            role="progressbar"
            aria-label="Progreso del DS-160"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={ds160Percentage}
          >
            <span style={{ width: `${ds160Percentage}%` }} />
          </div>
        </article>

        <article className="dash-stat-card">
          <span className="dash-stat-card__icon" aria-hidden="true"><FileCheck2 size={20} /></span>
          <span className="dash-stat-card__label">Documentos subidos</span>
          <strong className="dash-stat-card__value">{documentCount}</strong>
          <span className="dash-stat-card__hint">
            {documentCount === 1 ? "documento asociado" : "documentos asociados"}
          </span>
        </article>

        <article className="dash-stat-card">
          <span className="dash-stat-card__icon" aria-hidden="true"><Route size={20} /></span>
          <span className="dash-stat-card__label">Etapa actual</span>
          <strong className="dash-stat-card__stage">{currentStage}</strong>
          <span className="dash-stat-card__hint">Estado de tu trámite</span>
        </article>
      </div>
    </section>
  );
}
