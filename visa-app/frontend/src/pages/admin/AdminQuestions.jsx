import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import QuestionBankModal from "../../components/QuestionBankModal";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  AdminPageHeader,
  AdminPagination,
  AdminResourceState,
  AdminSearch,
} from "../../components/admin/AdminShared";
import useAdminResource, { adminRequest } from "../../hooks/useAdminResource";

const categories = [
  "General", "Viaje", "Finanzas", "Laboral", "Historial",
  "Migración", "Relaciones", "Personal",
];
const difficulties = ["Fácil", "Media", "Alta"];
const PAGE_SIZE = 8;

export default function AdminQuestions() {
  const resource = useAdminResource("/questions/admin");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const deleteCancelRef = useRef(null);
  const questions = useMemo(() => resource.data?.questions || [], [resource.data]);
  const filtered = useMemo(
    () => questions.filter((item) => (
      (category === "all" || item.category === category)
      && (difficulty === "all" || item.difficulty === difficulty)
      && (status === "all" || (status === "active" ? item.activo !== false : item.activo === false))
      && `${item.question} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    )),
    [category, difficulty, query, questions, status]
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = questions.filter((item) => item.activo !== false).length;
  const inactiveCount = questions.length - activeCount;

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    if (!deleteQuestion) return undefined;
    deleteCancelRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !saving) setDeleteQuestion(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteQuestion, saving]);

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

  const toggleActive = async (question) => {
    setSaving(true);
    setNotice("");
    try {
      await adminRequest(`/questions/${question.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ activo: question.activo === false }),
      });
      setNotice(question.activo === false ? "Pregunta activada correctamente." : "Pregunta desactivada correctamente.");
      resource.retry();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async () => {
    if (!deleteQuestion) return;
    setSaving(true);
    setNotice("");
    try {
      await adminRequest(`/questions/${deleteQuestion.id}`, { method: "DELETE" });
      setDeleteQuestion(null);
      setNotice("Pregunta eliminada correctamente.");
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
          <AdminSearch value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Buscar preguntas..." />
          <label className="admin-filter-select">
            <span>Categoría</span>
            <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value="all">Todas</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="admin-filter-select">
            <span>Dificultad</span>
            <select value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1); }}>
              <option value="all">Todas</option>
              {difficulties.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="admin-filter-select">
            <span>Estado</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="all">Todos</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
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
                {visible.length ? visible.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.question}</strong></td>
                    <td>{item.category || "General"}</td>
                    <td><span className="admin-status admin-status--review">{item.difficulty || "Media"}</span></td>
                    <td><span className={`admin-status admin-status--${item.activo === false ? "correction" : "approved"}`}>{item.activo === false ? "Inactiva" : "Activa"}</span><small>{item.uso_count || 0} usos</small></td>
                    <td><div className="admin-question-actions"><button className="admin-secondary-button" type="button" onClick={() => setModal(item)}><Pencil aria-hidden="true" />Editar</button><button className="admin-secondary-button" type="button" disabled={saving} onClick={() => toggleActive(item)}><Power aria-hidden="true" />{item.activo === false ? "Activar" : "Desactivar"}</button><button className="admin-icon-button admin-icon-button--danger" type="button" disabled={saving} onClick={() => setDeleteQuestion(item)} aria-label={`Eliminar pregunta: ${item.question}`}><Trash2 aria-hidden="true" /></button></div></td>
                  </tr>
                )) : (
                  <tr><td className="admin-table-state" colSpan="5">No hay preguntas que coincidan con los filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!resource.isLoading && !resource.error && questions.length > 0 && <AdminPagination page={page} pages={pages} onChange={setPage} total={filtered.length} visible={visible.length} />}
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
      {deleteQuestion && <div className="admin-modal-backdrop"><section className="admin-modal admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-question-title" aria-describedby="delete-question-description"><header className="admin-modal__header"><h2 id="delete-question-title">Eliminar pregunta</h2><button className="admin-modal__close" type="button" onClick={() => setDeleteQuestion(null)} disabled={saving} aria-label="Cerrar"><X aria-hidden="true" /></button></header><div className="admin-confirm-dialog__body"><p id="delete-question-description">Esta acción eliminará permanentemente la pregunta:</p><strong>{deleteQuestion.question}</strong></div><footer><button ref={deleteCancelRef} className="admin-secondary-button" type="button" onClick={() => setDeleteQuestion(null)} disabled={saving}>Cancelar</button><button className="admin-danger-button" type="button" onClick={removeQuestion} disabled={saving}>{saving ? "Eliminando..." : "Eliminar pregunta"}</button></footer></section></div>}
    </AdminLayout>
  );
}
