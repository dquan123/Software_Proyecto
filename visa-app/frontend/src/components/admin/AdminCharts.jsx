function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export function AdminGroupedBarChart({ items, primaryLabel = "Asignados", secondaryLabel = "Pendientes" }) {
  const maximum = Math.max(1, ...items.flatMap((item) => [numeric(item.asignados), numeric(item.pendientes)]));

  if (!items.length) return <p className="admin-chart-empty">No hay datos disponibles.</p>;

  return (
    <figure className="admin-chart admin-chart--grouped" aria-label={`Gráfica de ${primaryLabel.toLowerCase()} y ${secondaryLabel.toLowerCase()}`}>
      <div className="admin-chart__legend" aria-hidden="true"><span><i />{primaryLabel}</span><span><i />{secondaryLabel}</span></div>
      <div className="admin-grouped-chart__plot">
        {items.slice(0, 6).map((item) => (
          <div className="admin-grouped-chart__group" key={item.id || item.nombre}>
            <div className="admin-grouped-chart__bars">
              <i style={{ height: `${Math.max(4, (numeric(item.asignados) / maximum) * 100)}%` }} title={`${item.nombre}: ${numeric(item.asignados)} ${primaryLabel.toLowerCase()}`} />
              <i style={{ height: `${Math.max(4, (numeric(item.pendientes) / maximum) * 100)}%` }} title={`${item.nombre}: ${numeric(item.pendientes)} ${secondaryLabel.toLowerCase()}`} />
            </div>
            <strong>{item.nombre}</strong>
            <span className="sr-only">{numeric(item.asignados)} {primaryLabel.toLowerCase()}, {numeric(item.pendientes)} {secondaryLabel.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function AdminLineChart({ items }) {
  if (!items.length) return <p className="admin-chart-empty">No hay solicitudes en este periodo.</p>;
  const width = 640;
  const height = 260;
  const values = items.map((item) => numeric(item.total));
  const maximum = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = items.length === 1 ? width / 2 : 24 + (index * (width - 48)) / (items.length - 1);
    const y = height - 28 - (value / maximum) * (height - 64);
    return { x, y, value, label: items[index].label };
  });

  return (
    <figure className="admin-chart" aria-label="Nuevas solicitudes por mes">
      <svg className="admin-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución de nuevas solicitudes">
        {[0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1="24" x2={width - 24} y1={height - 28 - ratio * (height - 64)} y2={height - 28 - ratio * (height - 64)} />)}
        <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} />
        {points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r="5"><title>{point.label}: {point.value}</title></circle>)}
      </svg>
      <div className="admin-chart__labels">{items.map((item) => <span key={item.label}>{item.label}</span>)}</div>
    </figure>
  );
}

export function AdminVerticalBarChart({ items }) {
  const maximum = Math.max(1, ...items.map((item) => numeric(item.total)));
  if (!items.length) return <p className="admin-chart-empty">No hay etapas registradas.</p>;

  return (
    <figure className="admin-chart admin-chart--vertical" aria-label="Solicitudes por etapa">
      <div className="admin-vertical-chart__plot">
        {items.map((item) => <div key={item.label}><i style={{ height: `${Math.max(4, numeric(item.total) / maximum * 100)}%` }}><span className="sr-only">{numeric(item.total)}</span></i><strong>{item.label || "Sin definir"}</strong></div>)}
      </div>
    </figure>
  );
}

export function AdminDonutChart({ items }) {
  const palette = ["#1e3a5f", "#e7194c", "#008765", "#e47a00", "#64748b"];
  const total = items.reduce((sum, item) => sum + numeric(item.total), 0);
  const stops = items.map((item, index) => {
    const preceding = items.slice(0, index).reduce((sum, current) => sum + numeric(current.total), 0);
    const start = total ? preceding / total * 100 : 0;
    const end = total ? (preceding + numeric(item.total)) / total * 100 : 0;
    return `${palette[index % palette.length]} ${start}% ${end}%`;
  });

  if (!items.length || !total) return <p className="admin-chart-empty">No hay documentos registrados.</p>;

  return (
    <figure className="admin-donut-chart" aria-label="Estado de documentos">
      <figcaption>{items.map((item, index) => <span key={item.label}><i style={{ background: palette[index % palette.length] }} /><b>{item.label || "Sin definir"}</b><strong>{Math.round(numeric(item.total) / total * 100)}%</strong></span>)}</figcaption>
      <div style={{ background: `conic-gradient(${stops.join(",")})` }} aria-hidden="true"><i /></div>
    </figure>
  );
}
