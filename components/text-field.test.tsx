import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";

describe("TextField", () => {
  it("liga o label ao campo", () => {
    render(<TextField label="Nome da conta" />);
    expect(screen.getByLabelText("Nome da conta")).toBeInTheDocument();
  });

  it("descreve dica e erro via aria-describedby e marca o campo como inválido", () => {
    render(<TextField label="Dia de vencimento" hint="Entre 1 e 31." error="Informe um dia entre 1 e 31." />);
    const input = screen.getByLabelText("Dia de vencimento");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Entre 1 e 31. Informe um dia entre 1 e 31.");
  });

  it("não marca inválido sem erro", () => {
    render(<TextField label="Valor" />);
    expect(screen.getByLabelText("Valor")).not.toHaveAttribute("aria-invalid");
  });
});
