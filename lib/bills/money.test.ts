import { describe, expect, it } from "vitest";
import { centsToInput, parseBRLToCents } from "./money";

describe("parseBRLToCents", () => {
  it.each([
    ["211,37", 21137],
    ["1.234,56", 123456],
    ["1234,56", 123456],
    ["80", 8000],
    ["80,5", 8050],
    ["R$ 2.850,00", 285000],
    ["12.345,67", 1234567],
  ])("%s → %d centavos", (input, cents) => {
    expect(parseBRLToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "12,345", "1.23,00", "-50", "0", "0,00", "12.34"])("recusa %j", (input) => {
    expect(parseBRLToCents(input)).toBeNull();
  });
});

describe("centsToInput", () => {
  it("formata para o campo", () => {
    expect(centsToInput(123456)).toBe("1.234,56");
    expect(centsToInput(5)).toBe("0,05");
  });
});
