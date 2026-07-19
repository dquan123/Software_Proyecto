import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuestionBankCard from "../components/QuestionBankCard";

const question = {
  id: 12,
  question: "Quien pagara los gastos de su viaje?",
  category: "Finanzas",
  difficulty: "Alta",
  is_required: true,
  created_at: "2026-07-01T12:00:00.000Z",
};

describe("QuestionBankCard", () => {
  it("muestra la pregunta y dispara la accion de editar", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <QuestionBankCard question={question} onEdit={onEdit} onDelete={vi.fn()} />
    );

    expect(screen.getByText(question.question)).toBeInTheDocument();
    expect(screen.getByText("Pregunta requerida")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /editar/i }));

    expect(onEdit).toHaveBeenCalledWith(question);
  });

  it("dispara la accion de eliminar con la pregunta seleccionada", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <QuestionBankCard question={question} onEdit={vi.fn()} onDelete={onDelete} />
    );

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith(question);
  });
});
