import { buildAdvisorWhatsappUrl } from "./advisorContact";

const TOTAL_DS160_SECTIONS = 10;
const REQUIRED_DOCUMENT_COUNT = 4;

export const PROCESS_STEPS = [
  {
    number: 1,
    shortLabel: "Perfil",
    label: "Creación de perfil",
    description: "Completa tu registro y selecciona el perfil de visa para iniciar tu solicitud.",
    action: { label: "Completar perfil", path: "/perfil" },
  },
  {
    number: 2,
    shortLabel: "DS-160",
    label: "Completar DS-160",
    description: "Llena el formulario oficial con tu información personal, familiar, laboral y de viaje.",
    action: { label: "Continuar llenando", path: "/ds160" },
  },
  {
    number: 3,
    shortLabel: "Documentos",
    label: "Subir documentos",
    description: "Carga los documentos requeridos para respaldar tu solicitud antes de continuar con el pago.",
    action: { label: "Subir documentos", path: "/documents" },
  },
  {
    number: 4,
    shortLabel: "Pago",
    label: "Pago de visa",
    description: "Prepara o registra el pago de la tarifa consular antes de programar tu cita.",
    action: { label: "Hablar con el asesor", path: buildAdvisorWhatsappUrl(), external: true },
  },
  {
    number: 5,
    shortLabel: "Cita",
    label: "Agendar cita",
    description: "Revisa la información para programar tu cita consular y organizar los siguientes pasos.",
    action: { label: "Hablar con el asesor", path: buildAdvisorWhatsappUrl(), external: true },
  },
  {
    number: 6,
    shortLabel: "Entrevista",
    label: "Preparación de entrevista",
    description: "Practica respuestas y revisa recomendaciones para llegar con más seguridad a tu entrevista.",
    action: { label: "Practicar ahora", path: "/entrevista" },
  },
  {
    number: 7,
    shortLabel: "Decisión",
    label: "Decisión final",
    description: "Da seguimiento a las notificaciones y al resultado final de tu proceso.",
    action: { label: "Ver notificaciones", path: "/notificaciones" },
  },
];

export const TOTAL_PROCESS_STEPS = PROCESS_STEPS.length;

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

  const summary = list.reduce(
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

  const missingRequiredDocuments = Math.max(0, REQUIRED_DOCUMENT_COUNT - summary.total);
  return {
    ...summary,
    pending: summary.pending + missingRequiredDocuments,
    required: REQUIRED_DOCUMENT_COUNT,
  };
}

function pluralizeDocument(count) {
  return count === 1 ? "documento" : "documentos";
}

function agreementRequires(count) {
  return count === 1 ? "requiere" : "requieren";
}

function clampStage(stageNumber) {
  const parsedStage = Number(stageNumber);
  if (!Number.isFinite(parsedStage)) return 1;
  return Math.min(TOTAL_PROCESS_STEPS, Math.max(1, Math.ceil(parsedStage)));
}

function stageFromTramite(tramite) {
  const currentStageText = String(tramite?.etapaActual || "").toLowerCase();

  if (currentStageText.includes("decisi")) return 7;
  if (currentStageText.includes("entrevista")) return 6;
  if (currentStageText.includes("cita")) return 5;
  if (currentStageText.includes("pago")) return 4;
  if (currentStageText.includes("document")) return 3;
  if (currentStageText.includes("ds-160") || currentStageText.includes("ds160")) return 2;
  if (currentStageText.includes("perfil")) return 1;

  const progreso = Number(tramite?.progreso);
  if (!Number.isFinite(progreso)) return 1;

  return clampStage(Math.ceil(Math.min(100, Math.max(0, progreso)) / (100 / TOTAL_PROCESS_STEPS)));
}

export function getCurrentProcessStage({
  session = null,
  tramite = {},
  ds160Percentage = 0,
  documentSummary = {},
} = {}) {
  if (!session?.perfil) return 1;
  if (Number(ds160Percentage) < 100) return 2;

  const pendingDocuments = Number(documentSummary.pending) || 0;
  const correctionDocuments = Number(documentSummary.correction) || 0;
  if (pendingDocuments > 0 || correctionDocuments > 0) return 3;

  return Math.max(4, stageFromTramite(tramite));
}

export function getProcessStageLabel(stageNumber) {
  return PROCESS_STEPS[clampStage(stageNumber) - 1]?.label || PROCESS_STEPS[0].label;
}

export function getProcessTimeline(stageNumber) {
  const currentStage = clampStage(stageNumber);

  return PROCESS_STEPS.map((step) => ({
    ...step,
    estado: step.number < currentStage ? "completada" : step.number === currentStage ? "actual" : "pendiente",
    done: step.number < currentStage,
    active: step.number === currentStage,
  }));
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
      timeEstimate: "Tiempo est.: 15 min",
      title: "Subir documentos",
      description: "Ya completaste el DS-160. Ahora carga los documentos requeridos para que tu expediente quede listo antes del pago.",
      path: "/documents",
      buttonLabel: "Subir documentos",
    },
    4: {
      priority: "PRIORIDAD ALTA",
      timeEstimate: "Tiempo est.: 20 min",
      title: tramite?.siguientePaso || "Realizar el pago de la tarifa de visa",
      description: "Ya completaste el DS-160. El siguiente paso es registrar o preparar el pago de la tarifa antes de programar tu cita.",
      path: buildAdvisorWhatsappUrl(),
      buttonLabel: "Hablar con el asesor",
    },
    5: {
      priority: "IMPORTANTE",
      timeEstimate: "Tiempo est.: 15 min",
      title: tramite?.siguientePaso || "Programar tu cita consular",
      description: "Organiza la fecha, revisa la ubicación del consulado y confirma que tus documentos estén listos antes de avanzar.",
      path: buildAdvisorWhatsappUrl(),
      buttonLabel: "Hablar con el asesor",
    },
    6: {
      priority: "IMPORTANTE",
      timeEstimate: "Tiempo est.: 25 min",
      title: tramite?.siguientePaso || "Prepararte para la entrevista consular",
      description: "Practica respuestas, revisa preguntas frecuentes y prepara tus documentos para llegar con más seguridad a la entrevista.",
      path: "/entrevista",
      buttonLabel: "Practicar ahora",
    },
    7: {
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
      cta: stageNumber >= 4 ? "Revisar avance" : "Explorar",
      path: "/cronologia",
      tone: "white",
    },
    {
      title: stageNumber >= 6 ? "Preparación de entrevista" : "Simulador de entrevista",
      description: stageNumber >= 6
        ? "Tu trámite ya está en etapa de entrevista. Practica antes de tu cita consular."
        : "Practica con preguntas reales para ganar confianza antes de tu cita consular.",
      cta: stageNumber >= 6 ? "Practicar ahora" : "Prepararme",
      path: "/entrevista",
      tone: "dark",
    },
  ];
}
