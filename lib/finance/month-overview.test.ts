import { describe, expect, it } from "vitest";
import { formatBRL } from "@/lib/format";
import { MOCK_TODAY, emptyFinanceData, mockFinanceData } from "./mock-data";
import {
  buildMonthOverview,
  effectiveAmount,
  isYearMonth,
  shiftMonth,
  subscriptionChargeDate,
} from "./month-overview";

const OCT = "2026-10";
const overview = buildMonthOverview(mockFinanceData, OCT, MOCK_TODAY);
const all = [...overview.overdue, ...overview.upcoming, ...overview.settled];
const nbsp = (s: string) => s.replace(/ /g, " ");

describe("mocks", () => {
  it("o total de cada fatura é a soma das suas transações", () => {
    for (const st of mockFinanceData.statements) {
      const total = mockFinanceData.transactions
        .filter((t) => t.statement_id === st.id)
        .reduce((s, t) => s + t.amount, 0);
      expect(total, st.id).toBe(st.total_amount);
    }
  });

  it("valores monetários são sempre centavos inteiros", () => {
    const amounts = [
      ...mockFinanceData.transactions.map((t) => t.amount),
      ...mockFinanceData.bills.map((b) => b.amount),
      ...mockFinanceData.subscriptions.map((s) => s.amount),
      ...mockFinanceData.statements.map((s) => s.total_amount),
    ];
    expect(amounts.every(Number.isSafeInteger)).toBe(true);
  });

  it("cartões guardam só os 4 últimos dígitos", () => {
    expect(mockFinanceData.cards.every((c) => /^\d{4}$/.test(c.last4))).toBe(true);
  });

  it("tem o cenário pedido: 8 contas, 2 cartões, 10 assinaturas, 3 metas e o valor alto", () => {
    expect(mockFinanceData.bills).toHaveLength(8);
    expect(mockFinanceData.cards).toHaveLength(2);
    expect(mockFinanceData.subscriptions).toHaveLength(10);
    expect(mockFinanceData.goals).toHaveLength(3);
    const itau = mockFinanceData.statements.find((s) => s.id === "st_itau_2026_10")!;
    expect(nbsp(formatBRL(itau.total_amount))).toBe("R$ 12.345,67");
  });
});

describe("buildMonthOverview — outubro de 2026", () => {
  it("2 contas atrasadas, no topo e em ordem de vencimento", () => {
    expect(overview.overdue.map((i) => i.name)).toEqual(["Condomínio", "Luz"]);
    expect(overview.overdue[0].daysFromToday).toBe(-8);
  });

  it("próximas em ordem cronológica, com assinaturas no cartão marcadas", () => {
    const dates = overview.upcoming.map((i) => i.dueDate);
    expect([...dates].sort()).toEqual(dates);
    const netflix = overview.upcoming.find((i) => i.name === "Netflix")!;
    expect(netflix.status).toBe("on_card");
    expect(netflix.cardName).toBe("Itaú");
    expect(netflix.payable).toBe(false);
  });

  it("assinatura anual fora do mês não aparece; teste grátis aparece com a data de fim", () => {
    expect(all.find((i) => i.name === "Amazon Prime")).toBeUndefined();
    expect(all.find((i) => i.name === "Duolingo Super")?.trialEndsAt).toBe("2026-10-16");
  });

  it("totais do mês", () => {
    expect(overview.totals.overdue).toBe(99137);
    expect(overview.totals.due).toBe(1702819);
    expect(overview.totals.paid).toBe(36917);
    expect(overview.totals.subscriptionsMonthly).toBe(55010);
    expect(overview.totals.trialSubscriptions).toBe(1);
  });

  it("assinaturas no cartão não são contadas duas vezes", () => {
    const onCard = all.filter((i) => i.status === "on_card");
    expect(onCard.length).toBeGreaterThan(0);
    const payableTotal = overview.totals.overdue + overview.totals.due + overview.totals.paid;
    const payableSum = all.filter((i) => i.payable).reduce((s, i) => s + effectiveAmount(i), 0);
    expect(payableTotal).toBe(payableSum);
    expect(onCard.every((i) => !i.payable)).toBe(true);
  });

  it("total por responsável, por categoria e o total do mês fecham entre si", () => {
    const payableTotal = overview.totals.overdue + overview.totals.due + overview.totals.paid;
    const ownersTotal = overview.owners.reduce((s, o) => s + o.total, 0);
    expect(ownersTotal).toBe(payableTotal);
    expect(overview.categoriesTotal).toBe(payableTotal);
  });

  it("totais por responsável", () => {
    const [becca, thiago] = overview.owners;
    expect(becca.member.display_name).toBe("Becca");
    expect(becca.total).toBe(463956);
    expect(becca.paid).toBe(17807);
    expect(thiago.total).toBe(1374917);
  });

  it("conta paga usa o valor real (estimado ≠ pago)", () => {
    const agua = overview.settled.find((i) => i.name === "Água")!;
    expect(agua.amount).toBe(9640);
    expect(effectiveAmount(agua)).toBe(9318);
  });

  it("categorias ordenadas do maior para o menor, estorno descontado", () => {
    const amounts = overview.categories.map((c) => c.amount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);
    expect(overview.categories.find((c) => c.name === "Compras")?.amount).toBe(582510);
  });

  it("metas: progresso e ritmo necessário", () => {
    const [lua, reserva, sofa] = overview.goals;
    expect(lua.percent).toBe(52);
    expect(lua.monthsLeft).toBe(9);
    expect(lua.monthlyNeeded).toBe(106667);
    expect(reserva.percent).toBe(15);
    expect(reserva.monthlyNeeded).toBeNull();
    expect(sofa.percent).toBe(92);
    expect(sofa.monthlyNeeded).toBe(18000);
  });

  it("aviso de assinaturas detectadas", () => {
    expect(overview.suggestionsCount).toBe(3);
  });
});

describe("marcar como pago (antes do banco)", () => {
  it("move o item para pagas e atualiza os totais", () => {
    const luz = overview.overdue.find((i) => i.name === "Luz")!;
    const after = buildMonthOverview(mockFinanceData, OCT, MOCK_TODAY, {
      [luz.id]: { paid_at: MOCK_TODAY, paid_by_member_id: "mem_becca", paid_amount: luz.amount },
    });
    expect(after.overdue.map((i) => i.name)).toEqual(["Condomínio"]);
    expect(after.settled.find((i) => i.name === "Luz")?.paidByMemberId).toBe("mem_becca");
    expect(after.totals.overdue).toBe(78000);
    expect(after.totals.paid).toBe(overview.totals.paid + 21137);
  });
});

describe("estados vazios", () => {
  it("primeiro acesso: nada cadastrado", () => {
    const empty = buildMonthOverview(emptyFinanceData, OCT, MOCK_TODAY);
    expect(empty.isFirstAccess).toBe(true);
    expect(empty.isMonthEmpty).toBe(true);
    expect(empty.totals.due).toBe(0);
    expect(empty.goals).toEqual([]);
  });

  it("mês sem lançamentos (setembro) não é primeiro acesso", () => {
    const sep = buildMonthOverview(mockFinanceData, "2026-09", MOCK_TODAY);
    expect(sep.isFirstAccess).toBe(false);
    expect(sep.isMonthEmpty).toBe(true);
  });
});

describe("datas", () => {
  it("shiftMonth atravessa o ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("isYearMonth valida o parâmetro da URL", () => {
    expect(isYearMonth("2026-10")).toBe(true);
    expect(isYearMonth("2026-13")).toBe(false);
    expect(isYearMonth("outubro")).toBe(false);
  });

  it("assinatura anual só cobra no mês de aniversário", () => {
    const prime = mockFinanceData.subscriptions.find((s) => s.id === "sub_prime")!;
    expect(subscriptionChargeDate(prime, "2027-03")).toBe("2027-03-08");
    expect(subscriptionChargeDate(prime, "2027-04")).toBeNull();
    expect(subscriptionChargeDate(prime, "2028-03")).toBe("2028-03-08");
  });
});
