import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "../components/Sidebar";

vi.mock("../hooks/useTheme", () => ({
  default: () => ({ isDark: false, toggleTheme: vi.fn() }),
}));

vi.mock("../components/TopActions", () => ({
  default: ({ userId, unreadCount }) => (
    <div data-testid="top-actions">{userId}:{unreadCount}</div>
  ),
}));

const renderSidebar = (currentPage = "inicio") =>
  render(
    <MemoryRouter>
      <Sidebar currentPage={currentPage} />
    </MemoryRouter>
  );

describe("Sidebar", () => {
  beforeEach(() => {
    localStorage.setItem("visaguide_session", JSON.stringify({
      id: 12,
      nombre: "Ana López",
      correo: "ana@example.com",
      perfil: "turismo_negocios",
    }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ total: 3 }),
    });
  });

  it("renderiza las opciones, rutas y datos del usuario dentro del router", async () => {
    renderSidebar();

    const expectedLinks = [
      ["Inicio", "/dashboard"],
      ["DS-160", "/ds160"],
      ["Cronología", "/cronologia"],
      ["Documentos", "/documents"],
      ["Entrevista", "/entrevista"],
      ["Chat con asesor", "/chat"],
    ];

    expectedLinks.forEach(([name, href]) => {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    });
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(screen.getByText("Solicitante B1/B2")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("top-actions")).toHaveTextContent("12:3"));
  });

  it("identifica visualmente la opción activa", () => {
    renderSidebar("documentos");

    expect(screen.getByRole("link", { name: "Documentos" })).toHaveStyle({
      backgroundColor: "#dc2649",
      color: "rgb(255, 255, 255)",
    });
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveStyle({
      backgroundColor: "#dc2649",
    });
  });

  it("permite expandir la navegación y activar el modo Senior", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const expand = screen.getByRole("button", { name: "Expandir barra lateral" });
    await user.click(expand);
    expect(screen.getByRole("button", { name: "Contraer barra lateral" })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    const senior = screen.getByRole("button", { name: "Alternar modo Senior" });
    await user.click(senior);
    expect(senior).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("modoSenior")).toBe("true");
  });
});
