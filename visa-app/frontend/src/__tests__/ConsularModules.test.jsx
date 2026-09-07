import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ConsularPayment from "../pages/ConsularPayment";
import ConsularAppointments from "../pages/ConsularAppointments";
import ConsularManagement from "../pages/ConsularManagement";

const session = { id: 2, id_usuario: 2, token: "signed-token", nombre: "Asesor", correo: "asesor@example.com", rol: "asesor" };
vi.mock("../hooks/useRequireAuth", () => ({ default: () => ({ isValidating: false, session }) }));
vi.mock("../components/Sidebar", () => ({ default: ({ currentPage }) => <nav data-testid="sidebar">{currentPage}</nav> }));
function response(data, ok = true) { return Promise.resolve({ ok, json: async () => data }); }

describe("módulos de pago y citas consulares", () => {
  beforeEach(() => { window.history.replaceState({}, "", "/"); vi.restoreAllMocks(); });

  it("muestra el paquete de Q2,300 y todo lo que incluye", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(response({ provider: "bank_transfer", bank: { configured: false, instructions: "Contacta a tu asesor" },
      packageAmountMinor: 230000, packageCurrency: "gtq", includedConsularFeeUsdCents: 18500,
      profileLabel: "Turismo y negocios B1/B2", customerPaid: true, consularPaid: false,
      latest: { status: "client_paid" }, payments: [{ id: 1, status: "client_paid", provider: "bank_transfer", created_at: "2026-09-06T12:00:00Z" }] }));
    render(<MemoryRouter><ConsularPayment /></MemoryRouter>);
    expect((await screen.findAllByText("Transferencia confirmada")).length).toBeGreaterThan(0);
    expect(screen.getByText("El paquete incluye")).toBeInTheDocument();
    expect(screen.getByText(/Llenado y confirmación del formulario DS-160/)).toBeInTheDocument();
    expect(screen.getAllByText(/2 acercamientos/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2,300\.00/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Ver seguimiento" })).toHaveAttribute("href", "/citas");
    expect(screen.getByRole("link", { name: "Ir a documentos" })).toHaveAttribute("href", "/documents");
  });

  it("bloquea el seguimiento mientras el cliente no ha pagado", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => String(url).includes("/payments/me")
      ? response({ customerPaid: false }) : response({ appointments: [] }));
    render(<MemoryRouter><ConsularAppointments /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Completa primero el pago del trámite" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver pago" })).toHaveAttribute("href", "/pagos");
  });

  it("permite registrar una transferencia bancaria con comprobante", async () => {
    const user = userEvent.setup();
    const unpaid = { provider: "bank_transfer", bank: { configured: true, bankName: "Banco", accountName: "Empresa", accountNumber: "123" },
      packageAmountMinor: 230000, packageCurrency: "gtq", includedConsularFeeUsdCents: 18500, customerPaid: false, transferPending: false, payments: [] };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url, options = {}) => {
      if (String(url).includes("/payments/bank-transfer")) return response({ payment: { id: 9, status: "transfer_pending" } });
      return response(options.method ? {} : unpaid);
    });
    render(<MemoryRouter><ConsularPayment /></MemoryRouter>);
    await user.type(await screen.findByLabelText("Referencia o número de boleta"), "TRX-123");
    await user.upload(screen.getByLabelText("Comprobante obligatorio (PDF, JPG o PNG)"), new File(["receipt"], "transfer.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Registrar transferencia" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/payments/bank-transfer"), expect.objectContaining({ method: "POST", body: expect.any(FormData) })));
  });

  it("muestra al cliente el recibo y la cita registrados por el asesor", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url) => String(url).includes("/payments/me")
      ? response({ customerPaid: true, consularPaid: true, latest: { official_receipt_number: "MRV-123" } })
      : response({ appointments: [{ id: 3, status: "scheduled", appointment_at: "2026-09-08T14:00:00.000Z", consulate: "Embajada", confirmation_code: "AA012345", reschedule_count: 1, remaining_reschedules: 1 }] }));
    render(<MemoryRouter><ConsularAppointments /></MemoryRouter>);
    expect(await screen.findByText("Pago oficial registrado")).toBeInTheDocument();
    expect(screen.getByText(/MRV-123/)).toBeInTheDocument();
    expect(screen.getAllByText("AA012345").length).toBeGreaterThan(0);
    expect(screen.getByText(/Acercamientos utilizados: 1 de 2/)).toBeInTheDocument();
  });

  it("permite al asesor registrar el comprobante oficial", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((url, options = {}) => {
      if (String(url).includes("/staff/consular-cases") && !options.method) return response({ cases: [{ payment_id: 41, user_id: 7, status: "client_paid", nombre: "Ana", correo: "ana@example.com", visa_profile_label: "Turismo B1/B2", amount_cents: 230000, package_amount_minor: 230000, package_currency: "gtq", included_consular_fee_usd_cents: 18500, transfer_reference: "TRX-123", transfer_receipt_url: "http://localhost:3000/local-files/transfer.pdf", transfer_submitted_at: "2026-09-06T12:00:00Z", transfer_reviewed_at: "2026-09-06T13:00:00Z" }] });
      if (String(url).includes("/receipt")) return response({ payment: { id: 41, status: "consular_paid" } });
      return response({ cases: [] });
    });
    render(<MemoryRouter><ConsularManagement /></MemoryRouter>);
    expect(await screen.findByRole("link", { name: "Ver comprobante del cliente" })).toHaveAttribute("href", "http://localhost:3000/local-files/transfer.pdf");
    expect(screen.getByText(/Confirmado:/)).toBeInTheDocument();
    await user.type(await screen.findByLabelText("Número de recibo oficial"), "MRV-123");
    const receiptInput = screen.getByLabelText("Comprobante obligatorio (PDF, JPG o PNG)");
    expect(screen.getByRole("button", { name: "Adjunta el comprobante oficial" })).toBeDisabled();
    await user.upload(receiptInput, new File(["receipt"], "receipt.pdf", { type: "application/pdf" }));
    await user.click(screen.getByRole("button", { name: "Registrar pago consular" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/receipt"), expect.objectContaining({ method: "POST", body: expect.any(FormData) })));
    expect(await screen.findByText("Pago consular y comprobante registrados.")).toBeInTheDocument();
  });

  it("permite corregir una cita después de usar los dos acercamientos", async () => {
    const appointmentAt = "2026-09-20T15:00:00.000Z";
    vi.spyOn(globalThis, "fetch").mockReturnValue(response({ cases: [{
      payment_id: 42, user_id: 8, status: "consular_paid", nombre: "Luis", correo: "luis@example.com",
      visa_profile_label: "Turismo B1/B2", package_amount_minor: 230000, package_currency: "gtq",
      included_consular_fee_usd_cents: 18500, appointment_id: 5, appointment_at: appointmentAt,
      confirmation_code: "AA012345", consulate: "Embajada", appointment_notes: "Llegar temprano",
      reschedule_count: 2, official_receipt_number: "MRV-456", official_receipt_url: "https://files.example/receipt.pdf",
    }] }));
    render(<MemoryRouter><ConsularManagement /></MemoryRouter>);
    expect(await screen.findByDisplayValue("AA012345")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Embajada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Llegar temprano")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar correcciones" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Actualizar pago consular" })).toBeEnabled();
  });
});
