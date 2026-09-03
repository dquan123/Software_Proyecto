const PROCESS_STATES = new Set(["En proceso", "Pendiente", "Aprobado", "Inactivo", "Completado"]);

/** @param {string} message @returns {never} */
function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

/** @param {unknown} value @param {string} field @returns {string} */
function dateValue(value, field) {
  if (value === undefined || value === "") return "";
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) invalid(`${field} debe usar el formato YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid(`${field} no es una fecha válida`);
  return value;
}

/**
 * @param {Record<string, unknown>} query
 * @returns {{from: string, to: string, status: string, advisor: string, days: number|null, active: boolean}}
 */
function parseAdminSearch(query = {}) {
  const from = dateValue(query.from, "Desde");
  const to = dateValue(query.to, "Hasta");
  if (from && to && from > to) invalid("La fecha inicial no puede ser posterior a la fecha final");
  const status = query.status ?? "";
  if (typeof status !== "string" || (status && !PROCESS_STATES.has(status))) invalid("Estado de solicitud inválido");
  const advisor = query.advisor ?? "";
  if (typeof advisor !== "string" || (advisor && advisor !== "unassigned" && (!/^[1-9]\d*$/.test(advisor) || !Number.isSafeInteger(Number(advisor)) || Number(advisor) > 2147483647))) invalid("Asesor inválido");
  let days = null;
  if (query.days !== undefined && query.days !== "") {
    if (typeof query.days !== "string" || !["30", "90", "365"].includes(query.days)) invalid("Periodo inválido");
    days = Number(query.days);
  }
  if (from || to) days = null;
  return { from, to, status, advisor, days, active: Boolean(from || to || status || advisor || days) };
}

/**
 * SQL identifiers below are constants; all user values are bound parameters.
 * A cohort is selected by PROCESS creation date/status/advisor. Documents and
 * forms follow that cohort, so aggregates and exports cannot disagree.
 * @param {ReturnType<typeof parseAdminSearch>} filter
 * @returns {{cte: string, values: Array<string|number>}}
 */
function buildAdminCohort(filter) {
  const values = [];
  const conditions = [];
  const bind = (value) => { values.push(value); return `$${values.length}`; };
  if (filter.from) conditions.push(`t.created_at >= ${bind(filter.from)}::date`);
  if (filter.to) conditions.push(`t.created_at < (${bind(filter.to)}::date + INTERVAL '1 day')`);
  if (filter.days) conditions.push(`t.created_at >= CURRENT_TIMESTAMP - (${bind(filter.days)}::int * INTERVAL '1 day')`);
  if (filter.status) conditions.push(`t.estado = ${bind(filter.status)}`);
  if (filter.advisor === "unassigned") conditions.push("t.id_asesor IS NULL");
  else if (filter.advisor) conditions.push(`t.id_asesor = ${bind(filter.advisor)}::int`);
  return {
    cte: `WITH filtered_processes AS (
      SELECT t.* FROM tramite t ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    )`,
    values,
  };
}

/**
 * Project the dashboard's tables onto one cohort BEFORE aggregation/LIMIT.
 * General administrative events cannot be attributed to an application, so
 * filtered dashboards show only applicant/document/interview events.
 * @param {ReturnType<typeof parseAdminSearch>} filter
 * @returns {{cte: string, values: Array<string|number>}}
 */
function buildDashboardCohort(filter) {
  const cohort = buildAdminCohort(filter);
  return {
    values: cohort.values,
    cte: `${cohort.cte.replace("FROM tramite t", "FROM public.tramite t")},
      tramite AS (SELECT * FROM filtered_processes),
      usuario AS (SELECT u.* FROM public.usuario u WHERE u.id_usuario IN (
        SELECT id_usuario FROM filtered_processes UNION SELECT id_asesor FROM filtered_processes
      )),
      documentos AS (SELECT d.* FROM public.documentos d WHERE d.usuario_id IN (SELECT id_usuario FROM filtered_processes)),
      formulario_ds160 AS (SELECT f.* FROM public.formulario_ds160 f WHERE f.id_usuario IN (SELECT id_usuario FROM filtered_processes)),
      interview_sessions AS (SELECT s.* FROM public.interview_sessions s WHERE s.user_id IN (SELECT id_usuario FROM filtered_processes)),
      admin_activity AS (SELECT a.* FROM public.admin_activity a WHERE FALSE)`,
  };
}

module.exports = { parseAdminSearch, buildAdminCohort, buildDashboardCohort };
