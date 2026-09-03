import { useId } from "react";
import { adminFilterError } from "../../utils/adminFilters";

/**
 * @param {{
 * value: import('../../utils/adminFilters').AdminFilters,
 * onChange: (value: import('../../utils/adminFilters').AdminFilters) => void,
 * onReset: () => void,
 * advisors?: import('../../utils/adminFilters').AdvisorOption[],
 * allowUnassigned?: boolean,
 * status?: string,
 * statuses?: Array<{value: string, label: string}>,
 * onStatusChange?: (value: string) => void,
 * dateLabel?: string,
 * showDates?: boolean
 * }} props
 */
export default function AdminAdvancedFilters({ value, onChange, onReset, advisors, allowUnassigned = true, status, statuses, onStatusChange, dateLabel = "Fecha de creación (UTC)", showDates = true }) {
  const errorId = useId();
  const error = adminFilterError(value);
  return <fieldset className="admin-advanced-filters">
    <legend>Búsqueda avanzada</legend>
    {showDates && <>
      <p className="admin-advanced-filters__hint">{dateLabel}. Incluye ambos días del rango.</p>
      <label>Desde<input type="date" value={value.from} max={value.to || undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={(event) => onChange({ ...value, from: event.target.value })} /></label>
      <label>Hasta<input type="date" value={value.to} min={value.from || undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={(event) => onChange({ ...value, to: event.target.value })} /></label>
    </>}
    {statuses && <label>Estado<select value={status} onChange={(event) => onStatusChange?.(event.target.value)}>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
    {advisors && <label>Asesor<select value={value.advisor} onChange={(event) => onChange({ ...value, advisor: event.target.value })}>
      <option value="">Todos los asesores</option>
      {allowUnassigned && <option value="unassigned">Sin asignar</option>}
      {advisors.map((advisor) => <option key={advisor.id} value={String(advisor.id)}>{advisor.nombre} · #{advisor.id}</option>)}
    </select></label>}
    <button type="button" className="admin-secondary-button" onClick={onReset}>Limpiar filtros</button>
    {error && <p id={errorId} className="admin-advanced-filters__error" role="alert">{error}</p>}
  </fieldset>;
}
