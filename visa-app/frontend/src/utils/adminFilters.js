/** @typedef {{from: string, to: string, advisor: string}} AdminFilters */
/** @typedef {{id: number|string, nombre: string}} AdvisorOption */

/** @type {Readonly<AdminFilters>} */
export const EMPTY_ADMIN_FILTERS = Object.freeze({ from: "", to: "", advisor: "" });

/** @param {string} value @returns {boolean} */
export function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** @param {AdminFilters} filters @returns {string} */
export function adminFilterError({ from, to }) {
  if ((from && !isCalendarDate(from)) || (to && !isCalendarDate(to))) return "Introduce una fecha válida.";
  return from && to && from > to ? "La fecha inicial no puede ser posterior a la fecha final." : "";
}

/**
 * Use the calendar date returned by the API (UTC), not the browser timezone.
 * Date-only database values and timestamps therefore share inclusive day limits.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function recordDate(value) {
  if (!value) return "";
  const date = String(value).slice(0, 10);
  return isCalendarDate(date) ? date : "";
}

/**
 * @param {AdminFilters} filters
 * @param {string|null|undefined} date
 * @param {number|string|null|undefined} advisorId
 * @returns {boolean}
 */
export function matchesAdminFilters(filters, date, advisorId) {
  if (adminFilterError(filters)) return false;
  if (filters.advisor === "unassigned" && advisorId != null && advisorId !== "") return false;
  if (filters.advisor && filters.advisor !== "unassigned" && String(advisorId ?? "") !== filters.advisor) return false;
  if (!filters.from && !filters.to) return true;
  const day = recordDate(date);
  return Boolean(day) && (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to);
}

/** @param {Array<{id?: number|string|null, nombre?: string|null}>} values @returns {AdvisorOption[]} */
export function advisorOptions(values) {
  const unique = new Map();
  for (const value of values) {
    if (value?.id != null && value.id !== "") unique.set(String(value.id), { id: value.id, nombre: value.nombre || `Asesor ${value.id}` });
  }
  return [...unique.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es") || String(a.id).localeCompare(String(b.id)));
}
