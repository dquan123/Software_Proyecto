import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, ReceiptText, Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import AdminLayout from "../components/admin/AdminLayout";
import { buildApiUrl } from "../config/api";
import useRequireAuth from "../hooks/useRequireAuth";
import "../styles/consular.css";

const DEFAULT_CONSULATE = "Embajada de Estados Unidos, Ciudad de Guatemala";
const emptyReceipt = { receiptNumber: "", notes: "", file: null };
const emptyAppointment = { appointmentAt: "", confirmationCode: "", consulate: DEFAULT_CONSULATE, notes: "" };

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function authHeaders(session, json = false) {
  return { Authorization: `Bearer ${session.token}`, ...(json ? { "Content-Type": "application/json" } : {}) };
}

export default function ConsularManagement() {
  const { isValidating, session } = useRequireAuth();
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [receipt, setReceipt] = useState(emptyReceipt);
  const [appointment, setAppointment] = useState(emptyAppointment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCases = useCallback(async (signal) => {
    const response = await fetch(buildApiUrl("/staff/consular-cases"), { headers: authHeaders(session), signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudieron cargar los expedientes.");
    setCases(data.cases || []);
    setSelectedId((current) => current || data.cases?.[0]?.payment_id || null);
  }, [session]);

  useEffect(() => {
    if (!session) return undefined;
    const controller = new AbortController();
    loadCases(controller.signal).catch((loadError) => { if (loadError.name !== "AbortError") setError(loadError.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, loadCases]);

  const selected = cases.find((item) => item.payment_id === selectedId) || null;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? cases.filter((item) => `${item.nombre} ${item.correo} ${item.visa_profile_label}`.toLowerCase().includes(normalized)) : cases;
  }, [cases, query]);

  useEffect(() => {
    setReceipt({
      receiptNumber: selected?.official_receipt_number || "",
      notes: selected?.consular_notes || "",
      file: null,
    });
    setAppointment(selected?.appointment_id ? {
      appointmentAt: toLocalDateTimeInput(selected.appointment_at),
      confirmationCode: selected.confirmation_code || "",
      consulate: selected.consulate || DEFAULT_CONSULATE,
      notes: selected.appointment_notes || "",
    } : emptyAppointment);
  }, [selected]);

  const appointmentDateChanged = Boolean(selected?.appointment_id && appointment.appointmentAt
    && new Date(appointment.appointmentAt).getTime() !== new Date(selected.appointment_at).getTime());
  const rescheduleLimitReached = Number(selected?.reschedule_count) >= 2 && appointmentDateChanged;

  const registerReceipt = async (event) => {
    event.preventDefault();
    if (!selected) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const body = new FormData();
      body.set("receiptNumber", receipt.receiptNumber);
      body.set("notes", receipt.notes);
      if (receipt.file) body.set("file", receipt.file);
      const response = await fetch(buildApiUrl(`/staff/consular-payments/${selected.payment_id}/receipt`), {
        method: "POST", headers: authHeaders(session), body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el pago consular.");
      setReceipt(emptyReceipt); setMessage("Pago consular y comprobante registrados.");
      await loadCases();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const startProcessing = async () => {
    if (!selected) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(buildApiUrl(`/staff/consular-payments/${selected.payment_id}/start`), {
        method: "POST", headers: authHeaders(session, true), body: "{}",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo iniciar la gestión.");
      setMessage("Gestión consular iniciada.");
      await loadCases();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const reviewTransfer = async (approved) => {
    if (!selected) return;
    const reason = approved ? "" : window.prompt("Indica por qué se rechaza el comprobante:");
    if (!approved && !reason?.trim()) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(buildApiUrl(`/staff/consular-payments/${selected.payment_id}/review-transfer`), {
        method: "POST", headers: authHeaders(session, true), body: JSON.stringify({ approved, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo revisar la transferencia.");
      setMessage(approved ? "Transferencia confirmada." : "Comprobante rechazado; el cliente podrá enviar otro.");
      await loadCases();
    } catch (reviewError) { setError(reviewError.message); } finally { setSaving(false); }
  };

  const registerAppointment = async (event) => {
    event.preventDefault();
    if (!selected) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(buildApiUrl(`/staff/consular-cases/${selected.user_id}/appointment`), {
        method: "PUT", headers: authHeaders(session, true), body: JSON.stringify({ ...appointment, appointmentAt: new Date(appointment.appointmentAt).toISOString() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar la cita.");
      setAppointment(emptyAppointment); setMessage("Cita consular oficial registrada.");
      await loadCases();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const money = (cents, currency = "usd") => new Intl.NumberFormat("es-GT", { style: "currency", currency: currency.toUpperCase() }).format(Number(cents) / 100);

  const ContentContainer = session?.rol === "admin" ? "div" : "main";
  const content = <ContentContainer id={session?.rol === "admin" ? undefined : "main-content"} tabIndex="-1" className={session?.rol === "admin" ? "consular-main consular-main--admin" : "vg-main consular-main"}>
      <header className="consular-heading"><div className="consular-heading__icon"><ReceiptText aria-hidden="true" /></div><div><p className="consular-eyebrow">{session?.rol === "admin" ? "Operación administrativa" : "Operación del asesor"}</p><h1>Gestión consular</h1><p>{session?.rol === "admin" ? "Supervisa pagos oficiales y citas de todos los clientes." : "Registra pagos oficiales y citas de los clientes que tienes asignados."}</p></div></header>
      {message && <div className="consular-alert consular-alert--success" role="status">{message}</div>}
      {error && <div className="consular-alert consular-alert--error" role="alert">{error}</div>}
      {isValidating || loading ? <div className="consular-loading" role="status"><Loader2 className="consular-spin" aria-hidden="true" /> Cargando expedientes…</div> : <div className="consular-operations">
        <section className="consular-card consular-case-list"><label className="consular-search"><Search aria-hidden="true" /><span className="visually-hidden">Buscar cliente</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente…" /></label>
          {!filtered.length ? <p className="consular-empty">No hay comprobantes ni pagos pendientes de gestión.</p> : filtered.map((item) => <button type="button" key={item.payment_id} className={selectedId === item.payment_id ? "is-selected" : ""} onClick={() => { setSelectedId(item.payment_id); setMessage(""); setError(""); }}><span><strong>{item.nombre}</strong><small>{item.correo}</small></span><span className={`consular-status consular-status--${item.status === "consular_paid" ? "paid" : "pending"}`}>{item.status === "transfer_pending" ? "Validar transferencia" : item.status === "consular_paid" ? "Consulado pagado" : item.status === "consular_processing" ? "En gestión" : "Pago confirmado"}</span></button>)}</section>
        {selected && <div className="consular-operation-detail">
          <section className="consular-card">
            <div className="consular-card__top"><span>{selected.nombre}</span><span>{selected.visa_profile_label}</span></div>
            <dl className="consular-breakdown"><div><dt>{selected.status === "transfer_pending" ? "Total reportado" : "Total recibido"}</dt><dd>{money(selected.package_amount_minor || selected.amount_cents, selected.package_currency || selected.currency)}</dd></div><div><dt>Pago consular incluido</dt><dd>{money(selected.included_consular_fee_usd_cents || selected.consular_fee_cents, "usd")}</dd></div></dl>
            <p className="consular-muted">Paquete completo por persona: DS-160, cita, asesoramiento y hasta 2 acercamientos sujetos a disponibilidad.</p>
            <div className="consular-transfer-review">
              <h2>Comprobante del cliente</h2>
              <p><strong>Referencia:</strong> {selected.transfer_reference || "Sin referencia"}</p>
              {selected.transfer_submitted_at && <p><strong>Enviado:</strong> {new Date(selected.transfer_submitted_at).toLocaleString("es-GT")}</p>}
              {selected.transfer_reviewed_at && <p><strong>Confirmado:</strong> {new Date(selected.transfer_reviewed_at).toLocaleString("es-GT")}</p>}
              {selected.transfer_receipt_url ? <a className="consular-button consular-button--secondary" href={selected.transfer_receipt_url} target="_blank" rel="noreferrer">Ver comprobante del cliente</a> : <p className="consular-alert consular-alert--error">No hay un archivo de comprobante asociado.</p>}
              {selected.status === "transfer_pending" && <div className="consular-actions"><button className="consular-button" type="button" onClick={() => reviewTransfer(true)} disabled={saving}>Confirmar recepción</button><button className="consular-button consular-button--danger" type="button" onClick={() => reviewTransfer(false)} disabled={saving}>Rechazar</button></div>}
            </div>
            {selected.status === "client_paid" && <button className="consular-button" type="button" onClick={startProcessing} disabled={saving}>Iniciar gestión consular</button>}
          </section>
          <form className="consular-card consular-form" onSubmit={registerReceipt}><h2><ReceiptText aria-hidden="true" /> Pago ante el consulado</h2>{selected.official_receipt_number && <p className="consular-alert consular-alert--success"><CheckCircle2 aria-hidden="true" /> Registrado: {selected.official_receipt_number}</p>}<label>Número de recibo oficial<input required value={receipt.receiptNumber} onChange={(event) => setReceipt({ ...receipt, receiptNumber: event.target.value })} /></label><label>Comprobante obligatorio (PDF, JPG o PNG)<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => setReceipt({ ...receipt, file: event.target.files?.[0] || null })} /></label><label>Notas<textarea value={receipt.notes} onChange={(event) => setReceipt({ ...receipt, notes: event.target.value })} /></label><button className="consular-button" disabled={saving || selected.status === "transfer_pending" || (!selected.official_receipt_url && !receipt.file)}>{selected.status === "transfer_pending" ? "Confirma primero la transferencia" : !selected.official_receipt_url && !receipt.file ? "Adjunta el comprobante oficial" : saving ? "Guardando…" : selected.official_receipt_number ? "Actualizar pago consular" : "Registrar pago consular"}</button></form>
          <form className="consular-card consular-form" onSubmit={registerAppointment}><h2><CalendarDays aria-hidden="true" /> Cita oficial</h2>{selected.appointment_id && <><p className="consular-alert consular-alert--success"><CheckCircle2 aria-hidden="true" /> {new Date(selected.appointment_at).toLocaleString("es-GT")}, confirmación {selected.confirmation_code}</p><p className="consular-muted">Acercamientos utilizados: {selected.reschedule_count || 0} de 2. La nueva fecha debe ser anterior y depende de espacios liberados por la embajada.</p></>}<label>Fecha y hora<input required type="datetime-local" value={appointment.appointmentAt} onChange={(event) => setAppointment({ ...appointment, appointmentAt: event.target.value })} /></label><label>Número de confirmación oficial<input required value={appointment.confirmationCode} onChange={(event) => setAppointment({ ...appointment, confirmationCode: event.target.value })} /></label><label>Sede consular<input required value={appointment.consulate} onChange={(event) => setAppointment({ ...appointment, consulate: event.target.value })} /></label><label>Indicaciones para el cliente<textarea value={appointment.notes} onChange={(event) => setAppointment({ ...appointment, notes: event.target.value })} /></label><button className="consular-button" disabled={saving || selected.status !== "consular_paid" || rescheduleLimitReached}>{selected.status !== "consular_paid" ? "Registra primero el pago consular" : saving ? "Guardando…" : rescheduleLimitReached ? "Límite de acercamientos alcanzado" : selected.appointment_id ? appointmentDateChanged ? "Registrar acercamiento" : "Guardar correcciones" : "Registrar cita"}</button></form>
        </div>}
      </div>}
    </ContentContainer>;

  if (session?.rol === "admin") return <AdminLayout>{content}</AdminLayout>;
  return <div className="vg-layout"><Sidebar currentPage="gestion-consular" />{content}</div>;
}
