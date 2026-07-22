import { Map } from "lucide-react";
import "./VisaGuideLogo.css";

export default function VisaGuideLogo({
  variant = "full",
  className = "",
  textClassName = "",
  subtitle,
  accent = true,
}) {
  return (
    <div className={`visaguide-logo visaguide-logo--${variant} ${className}`.trim()}>
      <span className="visaguide-logo__mark" aria-hidden="true">
        <Map strokeWidth={2} aria-hidden="true" />
      </span>
      <span className={`visaguide-logo__text ${textClassName}`.trim()}>
        <span className="visaguide-logo__name">
          Visa<span className={accent ? "visaguide-logo__accent" : undefined}>Guide</span>
        </span>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </div>
  );
}
