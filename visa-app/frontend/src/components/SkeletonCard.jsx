/**
 * SkeletonCard — Reusable loading skeleton.
 *
 * Props:
 *   variant: "card" | "stat" | "message" | "document" | "notification" | "timeline"
 *   count: number of skeletons to render
 */
export function SkeletonCard({ variant = "card" }) {
  if (variant === "stat") {
    return (
      <div className="sk-stat">
        <div className="sk-line sk-line--sm" />
        <div className="sk-line sk-line--lg" style={{ marginTop: 10 }} />
        <div className="sk-line sk-line--xs" style={{ marginTop: 6 }} />
      </div>
    );
  }

  if (variant === "message") {
    return (
      <div className="sk-message">
        <div className="sk-bubble sk-bubble--left">
          <div className="sk-line sk-line--lg" />
          <div className="sk-line sk-line--md" style={{ marginTop: 8 }} />
        </div>
        <div className="sk-bubble sk-bubble--right">
          <div className="sk-line sk-line--md" />
        </div>
        <div className="sk-bubble sk-bubble--left">
          <div className="sk-line sk-line--lg" />
          <div className="sk-line sk-line--sm" style={{ marginTop: 8 }} />
          <div className="sk-line sk-line--md" style={{ marginTop: 8 }} />
        </div>
      </div>
    );
  }

  if (variant === "document") {
    return (
      <div className="sk-document">
        <div className="sk-document__main">
          <div>
            <div className="sk-line sk-line--lg" style={{ marginBottom: 10 }} />
            <div className="sk-line sk-line--md" />
          </div>
          <div className="sk-document__badge">
            <div className="sk-line sk-line--btn" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "notification") {
    return (
      <div className="sk-notification">
        <div className="sk-notification__icon" />
        <div style={{ flex: 1 }}>
          <div className="sk-line sk-line--lg" style={{ marginBottom: 10 }} />
          <div className="sk-line sk-line--md" style={{ marginBottom: 8 }} />
          <div className="sk-line sk-line--sm" />
        </div>
      </div>
    );
  }

  if (variant === "timeline") {
    return (
      <div className="sk-timeline">
        {[1, 2, 3].map((n) => (
          <div className="sk-timeline__item" key={n}>
            <div className="sk-timeline__dot" />
            <div className="sk-timeline__content">
              <div className="sk-line sk-line--lg" style={{ marginBottom: 8 }} />
              <div className="sk-line sk-line--md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // default: card
  return (
    <div className="sk-card">
      <div className="sk-line sk-line--sm" style={{ marginBottom: 12 }} />
      <div className="sk-line sk-line--lg" style={{ marginBottom: 8 }} />
      <div className="sk-line sk-line--md" style={{ marginBottom: 8 }} />
      <div className="sk-line sk-line--sm" />
    </div>
  );
}

export function SkeletonList({ variant = "card", count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </>
  );
}

export default SkeletonCard;
