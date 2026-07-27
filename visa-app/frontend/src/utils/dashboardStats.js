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

export function summarizeDocuments(documents) {
  const list = Array.isArray(documents) ? documents : [];

  return list.reduce(
    (summary, document) => {
      const status = document?.estado || document?.status || "pending";
      return {
        ...summary,
        total: summary.total + 1,
        [status]: (summary[status] || 0) + 1,
      };
    },
    { total: 0, approved: 0, review: 0, correction: 0, pending: 0 }
  );
}

function pluralizeDocument(count) {
  return count === 1 ? "documento" : "documentos";
}

function agreementRequires(count) {
  return count === 1 ? "requiere" : "requieren";
}

export function getDashboardNextAction({
  stageNumber = 1,
  ds160Percentage = 0,
  documentSummary = {},
  tramite = {},
} = {}) {
  const correctionCount = Number(documentSummary.correction) || 0;

  if (correctionCount > 0) {
    return {
      priority: "PRIORIDAD ALTA",
      timeEstimate: "Tiempo est.: 10 min",
      title: "Corregir documentos",
      description: `Tienes ${correctionCount} ${pluralizeDocument(correctionCount)} con correcciones pendientes. Atiende los comentarios para continuar con tu proceso.`,
      path: "/documents",
      buttonLabel: "Corregir ahora",
    };
  }

  const actionsByStage = {
    1: {
      priority: "PRIORIDAD ALTA",
      timeEstimate: "Tiempo est.: 8 min",
      title: "Completar perfil",
      description: "Agrega tu tipo de visa y datos principales para iniciar correctamente el seguimiento de tu trámite.",
      path: "/perfil",
      buttonLabel: "Completar perfil",
    },
    2: {
      priority: ds160Percentage > 0 ? "EN PROGRESO" : "PRIORIDAD ALTA",
      timeEstimate: "Tiempo est.: 45 min",
      title: "Completar formulario DS-160",
      description: "El formulario oficial requiere tu información personal, laboral y de viaje. Puedes guardar tu progreso por secciones.",
      path: "/ds160",
      buttonLabel: ds160Percentage > 0 ? "Continuar sección" : "Iniciar sección",
    },
    3: {
      priority: "PRIORIDAD ALTA",
      timeEstimate: "Tiempo est.: 20 min",
      title: tramite?.siguientePaso || "Realizar el pago de la tarifa de visa",
      description: "Ya completaste el DS-160. El siguiente paso es registrar o preparar el pago de la tarifa antes de programar tu cita.",
      path: "/cronologia",
      buttonLabel: "Ver indicaciones",
    },
    4: {
      priority: "IMPORTANTE",
      timeEstimate: "Tiempo est.: 15 min",
      title: tramite?.siguientePaso || "Programar tu cita consular",
      description: "Organiza la fecha, revisa la ubicación del consulado y confirma que tus documentos estén listos antes de avanzar.",
      path: "/cronologia",
      buttonLabel: "Revisar cita",
    },
    5: {
      priority: "IMPORTANTE",
      timeEstimate: "Tiempo est.: 25 min",
      title: tramite?.siguientePaso || "Prepararte para la entrevista consular",
      description: "Practica respuestas, revisa preguntas frecuentes y prepara tus documentos para llegar con más seguridad a la entrevista.",
      path: "/entrevista",
      buttonLabel: "Practicar ahora",
    },
    6: {
      priority: "SEGUIMIENTO",
      timeEstimate: "Tiempo est.: 5 min",
      title: tramite?.siguientePaso || "Esperar la decisión final del consulado",
      description: "Tu proceso está en la etapa final. Mantente pendiente de notificaciones y revisa la cronología para próximos pasos.",
      path: "/notificaciones",
      buttonLabel: "Ver notificaciones",
    },
  };

  return actionsByStage[stageNumber] || actionsByStage[1];
}

export function getDashboardQuickCards({
  documentSummary = {},
  stageNumber = 1,
} = {}) {
  const correctionCount = Number(documentSummary.correction) || 0;
  const pendingCount = Number(documentSummary.pending) || 0;
  const reviewCount = Number(documentSummary.review) || 0;
  const totalCount = Number(documentSummary.total) || 0;

  const documentCard = correctionCount > 0
    ? {
        badge: "IMPORTANTE",
        title: "Revisión de documentos",
        description: `Tienes ${correctionCount} ${pluralizeDocument(correctionCount)} que ${agreementRequires(correctionCount)} corrección.`,
        cta: "Corregir ahora",
        path: "/documents",
        tone: "yellow",
      }
    : pendingCount > 0
    ? {
        badge: "PENDIENTE",
        title: "Subir documentos",
        description: `Te faltan ${pendingCount} ${pluralizeDocument(pendingCount)} requeridos para completar tu expediente.`,
        cta: "Subir ahora",
        path: "/documents",
        tone: "yellow",
      }
    : {
        badge: reviewCount > 0 ? "EN REVISIÓN" : "LISTO",
        title: "Documentos",
        description: totalCount > 0
          ? `Tienes ${totalCount} ${pluralizeDocument(totalCount)} asociados a tu cuenta.`
          : "Aún no tienes documentos asociados a tu cuenta.",
        cta: "Ver documentos",
        path: "/documents",
        tone: "white",
      };

  return [
    documentCard,
    {
      title: "Ver cronología completa",
      description: "Revisa todos los pasos de tu proceso y qué esperar en cada etapa.",
      cta: stageNumber >= 3 ? "Revisar avance" : "Explorar",
      path: "/cronologia",
      tone: "white",
    },
    {
      title: stageNumber >= 5 ? "Preparación de entrevista" : "Simulador de entrevista",
      description: stageNumber >= 5
        ? "Tu trámite ya está en etapa de entrevista. Practica antes de tu cita consular."
        : "Practica con preguntas reales para ganar confianza antes de tu cita consular.",
      cta: stageNumber >= 5 ? "Practicar ahora" : "Prepararme",
      path: "/entrevista",
      tone: "dark",
    },
  ];
}
