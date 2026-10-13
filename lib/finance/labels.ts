import { formatDueDate } from "@/lib/format";
import type { MonthItem } from "./month-overview";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Texto do badge e da linha de apoio de um item da lista do mês. */
export function describeItem(item: MonthItem, memberName: (id: string) => string): { badge: string; meta: string } {
  const estimated = item.isEstimated ? " · valor estimado" : "";
  switch (item.status) {
    case "overdue":
      return {
        badge: `Atrasado há ${plural(-item.daysFromToday, "dia", "dias")}`,
        meta: `Venceu em ${formatDueDate(item.dueDate)}${estimated}`,
      };
    case "due": {
      const when =
        item.daysFromToday === 0 ? "hoje" : item.daysFromToday === 1 ? "amanhã" : `em ${item.daysFromToday} dias`;
      return { badge: "A pagar", meta: `Vence em ${formatDueDate(item.dueDate)} · ${when}${estimated}` };
    }
    case "paid": {
      const date = item.paidAt ? formatDueDate(item.paidAt) : formatDueDate(item.dueDate);
      const by = item.paidByMemberId ? ` por ${memberName(item.paidByMemberId)}` : "";
      return { badge: "Pago", meta: `Pago em ${date}${by}` };
    }
    case "on_card": {
      const badge = `No cartão ${item.cardName ?? ""}`.trim();
      if (item.trialEndsAt) return { badge, meta: `Teste grátis até ${formatDueDate(item.trialEndsAt)}` };
      return {
        badge,
        meta: `${item.daysFromToday < 0 ? "Cobrada em" : "Cobra em"} ${formatDueDate(item.dueDate)} · já entra na fatura`,
      };
    }
  }
}
