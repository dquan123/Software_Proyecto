const TOTAL_DS160_SECTIONS = 10;

export function calculateDs160Percentage(ds160) {
  if (ds160?.completado) return 100;
  const currentSection = Number(ds160?.seccion_actual);
  if (!Number.isFinite(currentSection)) return 0;
  const completedSections = Math.min(
    TOTAL_DS160_SECTIONS,
    Math.max(0, Math.floor(currentSection) - 1)
  );
  return Math.round((completedSections / TOTAL_DS160_SECTIONS) * 100);
}
