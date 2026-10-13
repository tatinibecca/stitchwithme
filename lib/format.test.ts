import { describe, expect, it } from "vitest";
import { formatBRL, formatDueDate } from "./format";

// Intl usa espaço não separável entre "R$" e o número.
const nbsp = (s: string) => s.replace(/ /g, " ");

describe("formatBRL", () => {
  it("formata centavos no padrão pt-BR", () => {
    expect(nbsp(formatBRL(123456))).toBe("R$ 1.234,56");
    expect(nbsp(formatBRL(5))).toBe("R$ 0,05");
    expect(nbsp(formatBRL(0))).toBe("R$ 0,00");
    expect(nbsp(formatBRL(100000000))).toBe("R$ 1.000.000,00");
  });

  it("formata estornos (negativos)", () => {
    expect(nbsp(formatBRL(-4990))).toBe("-R$ 49,90");
  });

  it("recusa valores que não são centavos inteiros", () => {
    expect(() => formatBRL(12.5)).toThrow(TypeError);
    expect(() => formatBRL(Number.NaN)).toThrow(TypeError);
  });
});

describe("formatDueDate", () => {
  it("mantém o dia do calendário no fuso de São Paulo", () => {
    expect(formatDueDate("2026-10-15")).toBe("15 de out.");
    expect(formatDueDate("2026-01-01")).toBe("01 de jan.");
  });
});
