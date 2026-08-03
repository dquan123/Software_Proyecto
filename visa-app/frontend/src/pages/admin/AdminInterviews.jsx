import AdminLayout from "../../components/admin/AdminLayout";
import QuestionBank from "../QuestionBank";

export default function AdminInterviews() {
  return (
    <AdminLayout>
      <QuestionBank embedded mode="interviews" />
    </AdminLayout>
  );
}
