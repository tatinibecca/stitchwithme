import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it.each([
    ["paid", "Pago"],
    ["due", "A vencer"],
    ["overdue", "Atrasado"],
    ["info", "Info"],
  ] as const)("status %s mostra texto e ícone, não só cor", (status, label) => {
    const { container } = render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    const icon = container.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("aceita um texto específico", () => {
    render(<StatusBadge status="overdue" label="Atrasado há 3 dias" />);
    expect(screen.getByText("Atrasado há 3 dias")).toBeInTheDocument();
  });
});
