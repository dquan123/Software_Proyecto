const FEEDBACK_STORAGE_KEY = "visaguide_interview_feedback_sessions";
const LATEST_FEEDBACK_KEY = "visaguide_latest_interview_feedback_id";

function readSessions() {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(sessions));
}

export function getInterviewFeedbackSessions() {
  return readSessions().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPendingInterviewFeedbackSessions() {
  return getInterviewFeedbackSessions().filter(
    (session) => session.status === "pending"
  );
}

export function getInterviewFeedbackSession(sessionId, userId) {
  const sessions = getInterviewFeedbackSessions();
  return (
    sessions.find(
      (session) =>
        session.id === sessionId &&
        (userId === undefined || session.userId === userId)
    ) || null
  );
}

export function getLatestInterviewFeedbackSession(userId) {
  const latestId = localStorage.getItem(LATEST_FEEDBACK_KEY);
  const sessions = getInterviewFeedbackSessions().filter(
    (session) => userId === undefined || session.userId === userId
  );

  return (
    sessions.find((session) => session.id === latestId) || sessions[0] || null
  );
}

export function createInterviewFeedbackSession({ questions, recordings, user }) {
  const now = new Date();
  const id = `interview-${user?.id || "anon"}-${now.getTime()}`;
  const recordedQuestionIds = new Set(Object.keys(recordings || {}));

  const feedbackSession = {
    id,
    userId: user?.id || null,
    userName: user?.nombre || "Usuario",
    userEmail: user?.correo || "",
    createdAt: now.toISOString(),
    status: "pending",
    statusLabel: "Pendiente de retroalimentación",
    questionCount: questions.length,
    recordedCount: recordedQuestionIds.size,
    questions: questions.map((question) => ({
      id: question.id,
      text: question.text,
      recorded: recordedQuestionIds.has(question.id),
      duration: recordings?.[question.id]?.duration || 0,
    })),
  };

  const sessions = readSessions();
  writeSessions([feedbackSession, ...sessions]);
  localStorage.setItem(LATEST_FEEDBACK_KEY, id);

  return feedbackSession;
}
