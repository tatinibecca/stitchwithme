/**
 * Monta a "Visão do mês" a partir das tabelas do PRD §6.
 * Função pura: recebe os dados, o mês e o "hoje", devolve o que a tela mostra.
 * Funciona igual com mocks ou com dados do Supabase.
 */
import type { Cents, FinanceData, Id, ISODate, Member, Subscription, YearMonth } from "./types";

export type ItemKind = "bill" | "statement" | "subscription";
/** on_card: assinatura cobrada no cartão — previsão, já está dentro da fatura (sem dupla contagem). */
export type ItemStatus = "overdue" | "due" | "paid" | "on_card";

export interface PaidOverride {
  paid_at: ISODate;
  paid_by_member_id: Id;
  paid_amount: Cents;
}
/** Pagamentos marcados na sessão, antes de existir banco. Chave = MonthItem.id */
export type PaidOverrides = Record<string, PaidOverride>;

export interface MonthItem {
  id: string;
  kind: ItemKind;
  sourceId: Id;
  name: string;
  categoryId: Id | null;
  ownerMemberId: Id;
  dueDate: ISODate;
  /** Valor previsto */
  amount: Cents;
  paidAmount: Cents | null;
  paidAt: ISODate | null;
  paidByMemberId: Id | null;
  status: ItemStatus;
  /** Entra nos totais do mês e aceita "Marcar como pago" */
  payable: boolean;
  isEstimated: boolean;
  cardName: string | null;
  trialEndsAt: ISODate | null;
  /** Dias até o vencimento (negativo = já venceu) */
  daysFromToday: number;
}

export interface OwnerTotals {
  member: Member;
  bills: Cents;
  statements: Cents;
  /** Assinaturas em débito/boleto (pagamento próprio) */
  subscriptions: Cents;
  /** Informativo: já está dentro das faturas */
  subscriptionsOnCard: Cents;
  total: Cents;
  paid: Cents;
}

export interface CategoryTotal {
  categoryId: Id;
  name: string;
  amount: Cents;
  /** 0–1 em relação ao total do mês */
  share: number;
}

export interface GoalProgress {
  id: Id;
  name: string;
  owner: Member | null;
  target: Cents;
  current: Cents;
  remaining: Cents;
  /** 0–100, inteiro */
  percent: number;
  targetDate: ISODate | null;
  monthsLeft: number | null;
  monthlyNeeded: Cents | null;
  status: "active" | "paused" | "completed";
}

export interface MonthOverview {
  month: YearMonth;
  today: ISODate;
  overdue: MonthItem[];
  upcoming: MonthItem[];
  /** Pagas e assinaturas de cartão já cobradas */
  settled: MonthItem[];
  totals: {
    overdue: Cents;
    due: Cents;
    paid: Cents;
    overdueCount: number;
    dueCount: number;
    paidCount: number;
    /** Equivalente mensal das assinaturas ativas (anuais ÷ 12) */
    subscriptionsMonthly: Cents;
    activeSubscriptions: number;
    trialSubscriptions: number;
  };
  categories: CategoryTotal[];
  categoriesTotal: Cents;
  owners: OwnerTotals[];
  goals: GoalProgress[];
  suggestionsCount: number;
  /** Nenhuma conta, cartão ou assinatura cadastrada: mostrar os primeiros passos */
  isFirstAccess: boolean;
  isMonthEmpty: boolean;
  itemCount: number;
}

// ---------- datas ----------

export function monthOf(date: ISODate): YearMonth {
  return date.slice(0, 7);
}

function toUTC(date: ISODate): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

function monthIndex(month: YearMonth): number {
  const [y, m] = month.split("-").map(Number);
  return y * 12 + (m - 1);
}

export function shiftMonth(month: YearMonth, delta: number): YearMonth {
  const i = monthIndex(month) + delta;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

export function isYearMonth(value: unknown): value is YearMonth {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Dia do mês, limitado ao último dia (ex.: dia 31 em fevereiro → 28/29). */
function dateInMonth(month: YearMonth, day: number): ISODate {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

/**
 * Data da cobrança da assinatura no mês, ou null se não cobra neste mês.
 * Projeta a partir de next_charge_date: meses anteriores ficam de fora
 * (o histórico vem de subscription_charges, não da projeção).
 */
export function subscriptionChargeDate(sub: Subscription, month: YearMonth): ISODate | null {
  if (sub.status === "cancelled") return null;
  const first = monthOf(sub.next_charge_date);
  const elapsed = monthIndex(month) - monthIndex(first);
  if (elapsed < 0) return null;
  if (sub.billing_cycle === "yearly" && elapsed % 12 !== 0) return null;
  return dateInMonth(month, Number(sub.next_charge_date.slice(8)));
}

export function monthlyEquivalent(sub: Subscription): Cents {
  return sub.billing_cycle === "yearly" ? Math.round(sub.amount / 12) : sub.amount;
}

// ---------- itens do mês ----------

function resolveStatus(item: Omit<MonthItem, "status">, paid: boolean): ItemStatus {
  if (!item.payable) return "on_card";
  if (paid) return "paid";
  return item.daysFromToday < 0 ? "overdue" : "due";
}

export function buildMonthItems(
  data: FinanceData,
  month: YearMonth,
  today: ISODate,
  overrides: PaidOverrides = {},
): MonthItem[] {
  const items: MonthItem[] = [];
  const cardsById = new Map(data.cards.map((c) => [c.id, c]));

  for (const occ of data.bill_occurrences) {
    if (monthOf(occ.due_date) !== month) continue;
    const bill = data.bills.find((b) => b.id === occ.bill_id);
    if (!bill) continue;
    const id = `bill:${occ.id}`;
    const o = overrides[id];
    const paid = occ.status === "paid" || Boolean(o);
    const base = {
      id,
      kind: "bill" as const,
      sourceId: occ.id,
      name: bill.name,
      categoryId: bill.category_id,
      ownerMemberId: bill.owner_member_id,
      dueDate: occ.due_date,
      amount: occ.expected_amount,
      paidAmount: o?.paid_amount ?? occ.paid_amount,
      paidAt: o?.paid_at ?? occ.paid_at,
      paidByMemberId: o?.paid_by_member_id ?? occ.paid_by_member_id,
      payable: true,
      isEstimated: bill.is_estimated,
      cardName: null,
      trialEndsAt: null,
      daysFromToday: daysBetween(today, occ.due_date),
    };
    items.push({ ...base, status: resolveStatus(base, paid) });
  }

  for (const st of data.statements) {
    if (monthOf(st.due_date) !== month) continue;
    const card = cardsById.get(st.card_id);
    if (!card) continue;
    const id = `statement:${st.id}`;
    const o = overrides[id];
    const paid = st.status === "paid" || Boolean(o);
    const base = {
      id,
      kind: "statement" as const,
      sourceId: st.id,
      name: `Fatura ${card.name}`,
      categoryId: null,
      ownerMemberId: card.owner_member_id,
      dueDate: st.due_date,
      amount: st.total_amount,
      paidAmount: o?.paid_amount ?? (paid ? st.total_amount : null),
      paidAt: o?.paid_at ?? st.paid_at,
      paidByMemberId: o?.paid_by_member_id ?? st.paid_by_member_id,
      payable: true,
      isEstimated: false,
      cardName: card.name,
      trialEndsAt: null,
      daysFromToday: daysBetween(today, st.due_date),
    };
    items.push({ ...base, status: resolveStatus(base, paid) });
  }

  for (const sub of data.subscriptions) {
    const due = subscriptionChargeDate(sub, month);
    if (!due) continue;
    const id = `subscription:${sub.id}:${month}`;
    const o = overrides[id];
    const charge = data.subscription_charges.find(
      (c) => c.subscription_id === sub.id && monthOf(c.charged_at) === month && c.transaction_id === null,
    );
    const onCard = sub.card_id !== null;
    const paid = !onCard && (Boolean(charge) || Boolean(o));
    const base = {
      id,
      kind: "subscription" as const,
      sourceId: sub.id,
      name: sub.name,
      categoryId: sub.category_id,
      ownerMemberId: sub.owner_member_id,
      dueDate: due,
      amount: sub.amount,
      paidAmount: o?.paid_amount ?? charge?.amount ?? null,
      paidAt: o?.paid_at ?? charge?.charged_at ?? null,
      paidByMemberId: o?.paid_by_member_id ?? null,
      payable: !onCard,
      isEstimated: false,
      cardName: onCard ? (cardsById.get(sub.card_id!)?.name ?? null) : null,
      trialEndsAt: sub.status === "trial" ? sub.trial_ends_at : null,
      daysFromToday: daysBetween(today, due),
    };
    items.push({ ...base, status: resolveStatus(base, paid) });
  }

  return items;
}

const byDueDate = (a: MonthItem, b: MonthItem) =>
  a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name, "pt-BR");

/** Valor que conta nos totais: o pago real quando já foi pago, senão o previsto. */
export function effectiveAmount(item: MonthItem): Cents {
  return item.status === "paid" && item.paidAmount !== null ? item.paidAmount : item.amount;
}

const sum = (values: Cents[]) => values.reduce((t, v) => t + v, 0);

// ---------- visão do mês ----------

export function buildMonthOverview(
  data: FinanceData,
  month: YearMonth,
  today: ISODate,
  overrides: PaidOverrides = {},
): MonthOverview {
  const items = buildMonthItems(data, month, today, overrides);

  const overdue = items.filter((i) => i.status === "overdue").sort(byDueDate);
  const upcoming = items
    .filter((i) => i.status === "due" || (i.status === "on_card" && i.daysFromToday >= 0))
    .sort(byDueDate);
  const settled = items
    .filter((i) => i.status === "paid" || (i.status === "on_card" && i.daysFromToday < 0))
    .sort(byDueDate);

  const payable = items.filter((i) => i.payable);
  const due = payable.filter((i) => i.status === "due");
  const paid = payable.filter((i) => i.status === "paid");

  const activeSubs = data.subscriptions.filter((s) => s.status === "active");

  // Categorias: contas + transações das faturas do mês + assinaturas fora do cartão.
  // Assinaturas no cartão entram só pelas transações da fatura (sem dupla contagem).
  const byCategory = new Map<Id, Cents>();
  const add = (categoryId: Id | null, amount: Cents) => {
    const key = categoryId ?? "sem_categoria";
    byCategory.set(key, (byCategory.get(key) ?? 0) + amount);
  };
  for (const item of items) {
    if (item.kind === "bill" || (item.kind === "subscription" && item.payable)) {
      add(item.categoryId, effectiveAmount(item));
    }
  }
  const statementIds = new Set(data.statements.filter((s) => monthOf(s.due_date) === month).map((s) => s.id));
  for (const t of data.transactions) {
    if (statementIds.has(t.statement_id)) add(t.category_id, t.amount);
  }
  const categoryName = new Map(data.categories.map((c) => [c.id, c.name]));
  const categoriesTotal = sum([...byCategory.values()]);
  const categories = [...byCategory.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => ({
      categoryId,
      name: categoryName.get(categoryId) ?? "Sem categoria",
      amount,
      share: categoriesTotal > 0 ? amount / categoriesTotal : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const owners: OwnerTotals[] = data.members.map((member) => {
    const mine = items.filter((i) => i.ownerMemberId === member.id);
    const minePayable = mine.filter((i) => i.payable);
    return {
      member,
      bills: sum(mine.filter((i) => i.kind === "bill").map(effectiveAmount)),
      statements: sum(mine.filter((i) => i.kind === "statement").map(effectiveAmount)),
      subscriptions: sum(mine.filter((i) => i.kind === "subscription" && i.payable).map(effectiveAmount)),
      subscriptionsOnCard: sum(mine.filter((i) => i.status === "on_card").map((i) => i.amount)),
      total: sum(minePayable.map(effectiveAmount)),
      paid: sum(minePayable.filter((i) => i.status === "paid").map(effectiveAmount)),
    };
  });

  const membersById = new Map(data.members.map((m) => [m.id, m]));
  const goals: GoalProgress[] = data.goals.map((g) => {
      const current = sum(data.goal_contributions.filter((c) => c.goal_id === g.id).map((c) => c.amount));
      const remaining = Math.max(0, g.target_amount - current);
      const monthsLeft = g.target_date ? Math.max(1, monthIndex(monthOf(g.target_date)) - monthIndex(monthOf(today))) : null;
      return {
        id: g.id,
        name: g.name,
        owner: g.owner_member_id ? (membersById.get(g.owner_member_id) ?? null) : null,
        target: g.target_amount,
        current,
        remaining,
        percent: g.target_amount > 0 ? Math.min(100, Math.floor((current / g.target_amount) * 100)) : 0,
        targetDate: g.target_date,
        monthsLeft,
        monthlyNeeded: monthsLeft && remaining > 0 ? Math.ceil(remaining / monthsLeft) : null,
        status: remaining === 0 ? "completed" : g.status,
      };
    });

  return {
    month,
    today,
    overdue,
    upcoming,
    settled,
    totals: {
      overdue: sum(overdue.map(effectiveAmount)),
      due: sum(due.map(effectiveAmount)),
      paid: sum(paid.map(effectiveAmount)),
      overdueCount: overdue.length,
      dueCount: due.length,
      paidCount: paid.length,
      subscriptionsMonthly: sum(activeSubs.map(monthlyEquivalent)),
      activeSubscriptions: activeSubs.length,
      trialSubscriptions: data.subscriptions.filter((s) => s.status === "trial").length,
    },
    categories,
    categoriesTotal,
    owners,
    goals,
    suggestionsCount: data.subscription_suggestions.length,
    isFirstAccess: data.bills.length === 0 && data.cards.length === 0 && data.subscriptions.length === 0,
    isMonthEmpty: items.length === 0,
    itemCount: items.length,
  };
}
