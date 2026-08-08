import { useCallback, useState } from "react";
import InterviewReviewPanel from "../../components/InterviewReviewPanel";
import AdminLayout from "../../components/admin/AdminLayout";
import QuestionBankToast from "../../components/QuestionBankToast";

export default function AdminInterviews() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, ...toast }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  return (
    <AdminLayout>
      <InterviewReviewPanel showHeader onToast={showToast} />
      <QuestionBankToast toasts={toasts} />
    </AdminLayout>
  );
}
