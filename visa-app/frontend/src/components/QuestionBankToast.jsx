export default function QuestionBankToast({ toasts }) {
  if (toasts.length === 0) return null;

  return (
    <div className="question-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div
          className={`question-toast question-toast--${toast.type || "success"}`}
          key={toast.id}
        >
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
