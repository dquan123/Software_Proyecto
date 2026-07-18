import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuestionBankModal from "../components/QuestionBankModal";

const categories = ["General", "Viaje", "Finanzas"];
const difficulties = ["Facil", "Media", "Alta"];

describe("QuestionBankModal", () => {
  it("envia el formulario con los datos ingresados para crear una pregunta", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <QuestionBankModal
        categories={categories}
        difficulties={difficulties}
        isSaving={false}
        mode="create"
        question={null}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    await user.type(
      screen.getByPlaceholderText("Escribe la pregunta consular..."),
      "Cual es el proposito de su viaje?"
    );
    await user.selectOptions(screen.getAllByRole("combobox")[0], "Viaje");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "Alta");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Crear pregunta" }));

    expect(onSubmit).toHaveBeenCalledWith({
      question: "Cual es el proposito de su viaje?",
      category: "Viaje",
      difficulty: "Alta",
      is_required: true,
    });
  });

  it("carga los valores de una pregunta existente en modo edicion", () => {
    render(
      <QuestionBankModal
        categories={categories}
        difficulties={difficulties}
        isSaving={false}
        mode="edit"
        question={{
          question: "Tiene familiares en el pais destino?",
          category: "Finanzas",
          difficulty: "Media",
          is_required: false,
        }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Editar pregunta" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tiene familiares en el pais destino?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
