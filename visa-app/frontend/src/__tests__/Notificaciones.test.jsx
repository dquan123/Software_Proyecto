import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Notificaciones from "../pages/Notificaciones";

const authState = vi.hoisted(() => ({
  isValidating: false,
  session: { id: 7, nombre: "Ana", correo: "ana@example.com" },
}));

vi.mock("../hooks/useRequireAuth", () => ({
  default: () => authState,
}));

vi.mock("../hooks/useModoSenior", () => ({ default: () => false }));
vi.mock("../components/Sidebar", () => ({ default: () => <nav>Sidebar</nav> }));

const notifications = [
  {
    id: 1,
    titulo: "Documento pendiente",
    mensaje: "Sube tu pasaporte.",
    tipo: "documento",
    leido: false,
    created_at: "2026-07-20T12:00:00.000Z",
  },
  {
    id: 2,
    titulo: "Perfil guardado",
    mensaje: "Tus datos están listos.",
    tipo: "info",
    leido: true,
    created_at: "2026-07-19T12:00:00.000Z",
  },
];

describe("Notificaciones", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ notificaciones: notifications }),
    });
  });

  it("renderiza leídas, no leídas y el contador pendiente", async () => {
    render(<Notificaciones />);

    expect(await screen.findByText("Documento pendiente")).toBeInTheDocument();
    expect(screen.getByText("Perfil guardado")).toBeInTheDocument();
    expect(screen.getByText(/notificación sin leer/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como leída: Documento pendiente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Marcar como leída: Perfil guardado" })).not.toBeInTheDocument();
  });

  it("muestra el estado vacío", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ notificaciones: [] }),
    });

    render(<Notificaciones />);

    expect(await screen.findByText("No tienes notificaciones")).toBeInTheDocument();
  });

  it("marca una notificación como leída y actualiza la interfaz", async () => {
    const user = userEvent.setup();
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notificaciones: notifications }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<Notificaciones />);
    await user.click(await screen.findByRole("button", { name: "Marcar como leída: Documento pendiente" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Marcar como leída: Documento pendiente" })).not.toBeInTheDocument()
    );
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/notificaciones/1/leer"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("elimina una notificación y actualiza la interfaz", async () => {
    const user = userEvent.setup();
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notificaciones: notifications }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<Notificaciones />);
    await user.click(await screen.findByRole("button", { name: "Eliminar: Documento pendiente" }));

    await waitFor(() => expect(screen.queryByText("Documento pendiente")).not.toBeInTheDocument());
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/notificaciones/1"),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ userId: 7 }),
      })
    );
  });

  it("muestra errores de carga y de acciones", async () => {
    const user = userEvent.setup();
    globalThis.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const { unmount } = render(<Notificaciones />);
    expect(await screen.findByText("No se pudieron cargar las notificaciones")).toBeInTheDocument();
    unmount();

    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ notificaciones: notifications }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    render(<Notificaciones />);
    await user.click(await screen.findByRole("button", { name: "Eliminar: Documento pendiente" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo eliminar la notificación");
  });
});
