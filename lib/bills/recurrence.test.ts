import { describe, expect, it } from "vitest";
import { billDueDate, describeRecurrence, lastDayOfMonth, nextDueDate, todayInSaoPaulo } from "./recurrence";

const monthly = (due_day: number, starts_on = "2026-01-01") => ({ due_day, recurrence_rule: "monthly", due_month: null, starts_on });

describe("billDueDate", () => {
  it("mensal: mesmo dia todo mês", () => {
    expect(billDueDate(monthly(10), "2026-10")).toBe("2026-10-10");
    expect(billDueDate(monthly(10), "2026-11")).toBe("2026-11-10");
  });

  it("dia 31 em mês de 30 dias vira o último dia", () => {
    expect(billDueDate(monthly(31), "2026-11")).toBe("2026-11-30");
    expect(billDueDate(monthly(31), "2026-12")).toBe("2026-12-31");
  });

  it("fevereiro: 28 em ano comum, 29 em ano bissexto", () => {
    expect(billDueDate(monthly(30), "2026-02")).toBe("2026-02-28");
    expect(billDueDate(monthly(29), "2028-02")).toBe("2028-02-29");
    expect(billDueDate(monthly(31), "2028-02")).toBe("2028-02-29");
  });

  it("anual: só no mês escolhido", () => {
    const ipva = { due_day: 15, recurrence_rule: "yearly", due_month: 3, starts_on: "2026-01-01" };
    expect(billDueDate(ipva, "2027-03")).toBe("2027-03-15");
    expect(billDueDate(ipva, "2027-04")).toBeNull();
  });

  it("não gera antes do mês de início", () => {
    expect(billDueDate(monthly(5, "2026-10-01"), "2026-09")).toBeNull();
    expect(billDueDate(monthly(5, "2026-10-01"), "2026-10")).toBe("2026-10-05");
  });
});

describe("nextDueDate", () => {
  it("este mês se ainda não venceu, senão o próximo", () => {
    expect(nextDueDate(monthly(20), "2026-10-13")).toBe("2026-10-20");
    expect(nextDueDate(monthly(10), "2026-10-13")).toBe("2026-11-10");
  });

  it("anual atravessa o ano", () => {
    expect(nextDueDate({ due_day: 15, recurrence_rule: "yearly", due_month: 3, starts_on: "2026-01-01" }, "2026-10-13")).toBe(
      "2027-03-15",
    );
  });
});

describe("textos e fuso", () => {
  it("descreve a recorrência", () => {
    expect(describeRecurrence({ due_day: 10, recurrence_rule: "monthly", due_month: null })).toBe("Todo dia 10");
    expect(describeRecurrence({ due_day: 31, recurrence_rule: "monthly", due_month: null })).toMatch(/último dia/);
    expect(describeRecurrence({ due_day: 15, recurrence_rule: "yearly", due_month: 3 })).toBe("Todo ano em 15 de março");
  });

  it("último dia do mês", () => {
    expect(lastDayOfMonth("2026-04")).toBe(30);
    expect(lastDayOfMonth("2028-02")).toBe(29);
  });

  it("hoje em São Paulo, mesmo quando em UTC já é o dia seguinte", () => {
    // 14/10 01:30 UTC = 13/10 22:30 em São Paulo (UTC−3)
    expect(todayInSaoPaulo(new Date("2026-10-14T01:30:00Z"))).toBe("2026-10-13");
  });
});
