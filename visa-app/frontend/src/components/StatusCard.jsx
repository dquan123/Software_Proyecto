const STATUS_ICONS = {
  approved: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m6 12 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  review: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 8v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  correction: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 7v6m0 4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  pending: (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 8h12M6 12h8M6 16h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

export default function StatusCard({ count, label, tone }) {
  return (
    <article className={`status-card status-card--${tone}`}>
      <div>
        <strong>{count}</strong>
        <span>{label}</span>
      </div>
      <span className="status-card__icon">{STATUS_ICONS[tone]}</span>
    </article>
  );
}
