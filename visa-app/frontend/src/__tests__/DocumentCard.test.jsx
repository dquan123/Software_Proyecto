import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DocumentCard from "../components/DocumentCard";

const passportDoc = {
  id: "passport",
  title: "Pasaporte vigente",
  category: "Identificacion Oficial",
  type: "pdf",
  required: true,
  status: "pending",
  updatedAt: "No subido",
  downloadUrl: "",
  storedDocumentId: null,
  feedback: "",
};

describe("DocumentCard", () => {
  it("rechaza archivos que no cumplen el tipo requerido", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const { container } = render(
      <DocumentCard
        doc={passportDoc}
        usuarioId={3}
        onStatusChange={vi.fn()}
        onUploadSuccess={vi.fn()}
        onDeleteSuccess={vi.fn()}
      />
    );

    const input = container.querySelector('input[type="file"]');
    const image = new File(["contenido"], "foto.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [image] } });

    expect(
      await screen.findByText("Este documento requiere un archivo PDF.")
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("muestra error si se intenta subir sin usuario autenticado", async () => {
    const user = userEvent.setup();

    render(
      <DocumentCard
        doc={passportDoc}
        usuarioId={null}
        onStatusChange={vi.fn()}
        onUploadSuccess={vi.fn()}
        onDeleteSuccess={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /subir archivo/i }));

    expect(
      screen.getByText("Inicia sesión para ligar este archivo a tu usuario.")
    ).toBeInTheDocument();
  });
});
