const HIGHLIGHT = {
  titulo: "¿Por qué es importante el DS-160?",
  texto: "Es el documento oficial sobre el cual el oficial consular basará el 90% de su decisión. Cada respuesta es evaluada algorítmicamente antes de tu entrevista. La precisión y consistencia son fundamentales.",
};

const ETAPAS = [
  { numero: 1, titulo: "Perfil", descripcion: "Comienza creando tu perfil en nuestra plataforma. Esto nos ayuda a adaptar los requisitos a tu situación específica (estudiante, turista, etc.)." },
  { numero: 2, titulo: "Formulario DS-160", descripcion: "El formulario oficial y más importante. Aquí recopilamos tus datos personales, de viaje y antecedentes. Debe llenarse con honestidad absoluta." },
  { numero: 3, titulo: "Revisión Experta", descripcion: "Nuestro equipo de asesores revisará tu DS-160 buscando inconsistencias, omisiones o posibles alertas que puedan causar rechazo." },
  { numero: 4, titulo: "Pago y Citas", descripcion: "Deberás pagar la tarifa MRV ($185 USD) en el banco autorizado y agendar dos citas: una para huellas (CAS) y otra para entrevista consular." },
  { numero: 5, titulo: "Preparación (Entrevista)", descripcion: "Te guiamos para recolectar los documentos necesarios y usamos nuestro simulador para prepararte emocional y mentalmente para la entrevista." },
];

export default function InformationSection({ modoSenior = false }) {
  return (
    <section id="informacion" className="info-section" aria-labelledby="information-title">
      <header className="info-section__header">
        <h2 id="information-title" style={{ fontSize: modoSenior ? "36px" : "var(--vg-section-title)" }}>Información del proceso</h2>
        <p style={{ fontSize: modoSenior ? "19px" : "var(--vg-body-size)" }}>
          Conoce los detalles de cada etapa para obtener tu visa B1/B2 sin contratiempos.
        </p>
      </header>

      <article className="info-highlight">
        <span className="info-highlight__icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 11v6" />
            <path d="M12 7h.01" />
          </svg>
        </span>
        <div>
          <h3 style={{ fontSize: modoSenior ? "24px" : "var(--vg-card-title)" }}>{HIGHLIGHT.titulo}</h3>
          <p style={{ fontSize: modoSenior ? "18px" : "var(--vg-body-size)" }}>{HIGHLIGHT.texto}</p>
        </div>
      </article>

      <div className="info-section__grid">
        {ETAPAS.map((etapa) => (
          <article className="info-card" key={etapa.numero}>
            <div className="info-card__header">
              <span aria-hidden="true">{etapa.numero}</span>
              <h3 style={{ fontSize: modoSenior ? "22px" : "var(--vg-card-title)" }}>{etapa.titulo}</h3>
            </div>
            <p style={{ fontSize: modoSenior ? "18px" : "var(--vg-body-size)" }}>{etapa.descripcion}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
