import { describe, expect, it } from "vitest";
import { parseBillForm } from "./form";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const valid = { name: "Luz", amount: "211,37", due_day: "10", recurrence_rule: "monthly", owner_member_id: "m1", is_estimated: "on" };

describe("parseBillForm", () => {
  it("converte o formulário em conta, com valor em centavos", () => {
    const result = parseBillForm(form(valid));
    expect(result).toEqual({
      bill: {
        name: "Luz", category_id: null, owner_member_id: "m1", amount: 21137, is_estimated: true,
        due_day: 10, recurrence_rule: "monthly", due_month: null, payment_method: null, notes: null,
      },
    });
  });

  it("aponta cada campo com problema, em pt-BR", () => {
    const result = parseBillForm(form({ name: " ", amount: "abc", due_day: "32", owner_member_id: "" }));
    expect(result).toEqual({
      fieldErrors: {
        name: "Informe o nome da conta.",
        amount: "Informe o valor em reais, por exemplo 211,37.",
        due_day: "Informe um dia entre 1 e 31.",
        owner_member_id: "Escolha quem é responsável pela conta.",
      },
    });
  });

  it("conta anual exige o mês", () => {
    const result = parseBillForm(form({ ...valid, recurrence_rule: "yearly" }));
    expect(result).toEqual({ fieldErrors: { due_month: "Escolha o mês em que a conta vence." } });
    const ok = parseBillForm(form({ ...valid, recurrence_rule: "yearly", due_month: "3" }));
    expect("bill" in ok && ok.bill.due_month).toBe(3);
  });

  it("ignora forma de pagamento desconhecida", () => {
    const result = parseBillForm(form({ ...valid, payment_method: "bitcoin" }));
    expect("bill" in result && result.bill.payment_method).toBeNull();
  });
});
