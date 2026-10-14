/**
 * Regras de recorrência das contas fixas. Espelham public.bill_due_date no
 * banco (supabase/migrations/…_categories_bills.sql); os dois lados têm testes
 * com os mesmos casos.
 */
import type { ISODate, YearMonth } from "@/lib/finance/types";

export type RecurrenceRule = "monthly" | "yearly";

export interface BillSchedule {
  due_day: number;
  recurrence_rule: RecurrenceRule | string;
  /** 1–12, obrigatório quando anual */
  due_month: number | null;
  /** Dia 1 do primeiro mês em que a conta vence ("YYYY-MM-01") */
  starts_on: ISODate;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function lastDayOfMonth(month: YearMonth): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Vencimento da conta no mês, ou null se ela não vence nesse mês. */
export function billDueDate(bill: BillSchedule, month: YearMonth): ISODate | null {
  if (`${month}-01` < bill.starts_on) return null;
  if (bill.recurrence_rule === "yearly" && Number(month.slice(5)) !== bill.due_month) return null;
  return `${month}-${pad(Math.min(bill.due_day, lastDayOfMonth(month)))}`;
}

/** Próximo vencimento a partir de hoje (inclusive), procurando até 13 meses à frente. */
export function nextDueDate(bill: BillSchedule, today: ISODate): ISODate | null {
  let month = today.slice(0, 7);
  for (let i = 0; i < 13; i++) {
    const due = billDueDate(bill, month);
    if (due && due >= today) return due;
    const [y, m] = month.split("-").map(Number);
    month = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  }
  return null;
}

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "Todo dia 10" · "Todo ano em 15 de março" */
export function describeRecurrence(bill: Pick<BillSchedule, "due_day" | "recurrence_rule" | "due_month">): string {
  if (bill.recurrence_rule === "yearly" && bill.due_month) {
    return `Todo ano em ${bill.due_day} de ${MONTHS[bill.due_month - 1]}`;
  }
  return bill.due_day >= 29 ? `Todo dia ${bill.due_day} (ou o último dia do mês)` : `Todo dia ${bill.due_day}`;
}

export const MONTH_NAMES = MONTHS;

/** Hoje no fuso America/Sao_Paulo, como "YYYY-MM-DD". */
export function todayInSaoPaulo(now: Date = new Date()): ISODate {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
