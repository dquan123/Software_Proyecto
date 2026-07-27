import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardStats from "../components/DashboardStats";
import { calculateDs160Percentage } from "../utils/dashboardStats";

describe("DashboardStats", () => {
  it("calcula el porcentaje desde las secciones persistidas del DS-160", () => {
    expect(calculateDs160Percentage({ seccion_actual: 1, completado: false })).toBe(0);
    expect(calculateDs160Percentage({ seccion_actual: 6, completado: false })).toBe(50);
    expect(calculateDs160Percentage({ seccion_actual: 10, completado: true })).toBe(100);
    expect(calculateDs160Percentage({ seccion_actual: 99, completado: false })).toBe(100);
  });

  it("renderiza el porcentaje, documentos y etapa real", () => {
    render(
      <DashboardStats
        loading={false}
        error=""
        stats={{
          ds160Percentage: 50,
          documentCount: 3,
          currentStage: "Pago de visa",
        }}
      />
    );

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progreso del DS-160" })).toHaveAttribute(
      "aria-valuenow",
      "50"
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Pago de visa")).toBeInTheDocument();
  });

  it("muestra valores seguros cuando no existen datos", () => {
    render(<DashboardStats loading={false} error="" stats={null} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Trámite no iniciado")).toBeInTheDocument();
  });

  it("muestra estados de carga y error", () => {
    const { rerender } = render(<DashboardStats loading error="" stats={null} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando estadísticas");

    rerender(
      <DashboardStats
        loading={false}
        error="Algunas estadísticas no pudieron actualizarse."
        stats={{ ds160Percentage: 0, documentCount: 0, currentStage: "" }}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("no pudieron actualizarse");
  });
});
