const DEFAULT_ADVISOR_MESSAGE =
  "Hola, necesito apoyo con el pago de visa y la agenda de mi cita en VisaGuide.";

function getWhatsappPhone() {
  return (import.meta.env.VITE_WHATSAPP_PHONE || "").replace(/\D/g, "");
}

export function buildAdvisorWhatsappUrl(message = DEFAULT_ADVISOR_MESSAGE) {
  const text = encodeURIComponent(message);
  const phone = getWhatsappPhone();

  if (!phone) {
    return `https://wa.me/?text=${text}`;
  }

  return `https://wa.me/${phone}?text=${text}`;
}
