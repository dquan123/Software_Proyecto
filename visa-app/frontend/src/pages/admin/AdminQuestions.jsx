import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import QuestionBankModal from "../../components/QuestionBankModal";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  AdminPageHeader,
  AdminResourceState,
  AdminSearch,
} from "../../components/admin/AdminShared";
import useAdminResource, { adminRequest } from "../../hooks/useAdminResource";

const categories = [
  "General", "Viaje", "Finanzas", "Laboral", "Historial",
  "Migración", "Relaciones", "Personal",
];
const difficulties = ["Fácil", "Media", "Alta"];

export default function AdminQuestions() {
  const resource = useAdminResource("/questions");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const questions = useMemo(() => resource.data?.questions || [], [resource.data]);
  const filtered = useMemo(
    () => questions.filter((item) => (
      (category === "all" || item.category === category)
      && (difficulty === "all" || item.difficulty === difficulty)
      && `${item.question} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    )),
    [category, difficulty, query, questions]
  );
  const activeCount = questions.filter((item) => item.activo !== false).length;
  const inactiveCount = questions.length - activeCount;

  const submit = async (form) => {
    setSaving(true);
    try {
      await adminRequest(modal?.id ? `/questions/${modal.id}` : "/questions", {
        method: modal?.id ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setModal(null);
      setNotice("Pregunta guardada correctamente.");
      resource.retry();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Banco de Preguntas"
        description="Administración del catálogo de preguntas del simulador."
        action={(
          <button className="admin-primary-button" type="button" onClick={() => setModal({})}>
            <Plus aria-hidden="true" />Nueva pregunta
          </button>
        )}
      />
      {notice && <p className="admin-feedback" role="status">{notice}</p>}
      <section className="admin-summary-grid admin-summary-grid--three">
        <article><small>Total activas</small><strong>{activeCount}</strong></article>
        <article><small>Categorías</small><strong>{new Set(questions.map((item) => item.category)).size}</strong></article>
        <article><small>Inactivas</small><strong>{inactiveCount}</strong></article>
      </section>
      <section className="admin-list-card">
        <div className="admin-list-toolbar">
          <AdminSearch value={query} onChange={setQuery} placeholder="Buscar preguntas..." />
          <label className="admin-filter-select">
            <span>Categoría</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">Todas</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="admin-filter-select">
            <span>Dificultad</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="all">Todas</option>
              {difficulties.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <AdminResourceState
          {...resource}
          isEmpty={!questions.length}
          empty="No hay preguntas registradas."
        />
        {!resource.isLoading && !resource.error && questions.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Pregunta</th><th>Visa / categoría</th><th>Dificultad</th><th>Uso</th><th>Acción</th></tr></thead>
              <tbody>
                {filtered.length ? filtered.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.question}</strong></td>
                    <td>{item.category || "General"}</td>
                    <td><span className="admin-status admin-status--review">{item.difficulty || "Media"}</span></td>
                    <td>{item.uso_count || 0} veces</td>
                    <td><button className="admin-secondary-button" type="button" onClick={() => setModal(item)}>Editar</button></td>
                  </tr>
                )) : (
                  <tr><td className="admin-table-state" colSpan="5">No hay preguntas que coincidan con los filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal && (
        <QuestionBankModal
          categories={categories}
          difficulties={difficulties}
          isSaving={saving}
          mode={modal.id ? "edit" : "create"}
          question={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSubmit={submit}
        />
      )}
    </AdminLayout>
  );
}
