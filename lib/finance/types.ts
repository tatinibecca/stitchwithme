/**
 * Tipos do domínio Finanças — espelham o modelo de dados do PRD §6, com os
 * mesmos nomes de tabela e coluna (snake_case), para que os mocks possam ser
 * trocados pelas linhas do Supabase sem mudar a tela.
 *
 * - Valores monetários em centavos (integer). Nunca float.
 * - Datas de calendário como "YYYY-MM-DD"; mês de referência como "YYYY-MM".
 * - Toda tabela tem household_id (regra do CLAUDE.md, base da RLS).
 * Extensões ao PRD estão marcadas com "extensão" e registradas em docs/DECISIONS.md.
 */

export type Cents = number;
export type ISODate = string;
export type YearMonth = string;
export type Id = string;

export interface Household {
  id: Id;
  name: string;
  created_at: string;
}

export interface Member {
  id: Id;
  household_id: Id;
  user_id: Id;
  display_name: string;
  role: "owner" | "member";
}

export interface Category {
  id: Id;
  household_id: Id;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
}

export interface Card {
  id: Id;
  household_id: Id;
  owner_member_id: Id;
  name: string;
  bank: string;
  /** Só os 4 últimos dígitos. Nunca o número completo. */
  last4: string;
  closing_day: number;
  due_day: number;
  csv_mapping: Record<string, string> | null;
}

export interface Statement {
  id: Id;
  household_id: Id;
  card_id: Id;
  reference_month: YearMonth;
  due_date: ISODate;
  total_amount: Cents;
  import_batch_id: Id | null;
  status: "open" | "paid";
  /** extensão: quem marcou a fatura como paga e quando (PRD §9, "quem fez o quê") */
  paid_at: ISODate | null;
  paid_by_member_id: Id | null;
}

export interface Transaction {
  id: Id;
  household_id: Id;
  card_id: Id;
  statement_id: Id;
  date: ISODate;
  description_raw: string;
  description_normalized: string;
  /** Negativo = estorno */
  amount: Cents;
  installment_current: number | null;
  installment_total: number | null;
  category_id: Id | null;
  import_batch_id: Id | null;
  dedupe_hash: string;
}

export interface Bill {
  id: Id;
  household_id: Id;
  name: string;
  category_id: Id | null;
  owner_member_id: Id;
  amount: Cents;
  is_estimated: boolean;
  due_day: number;
  recurrence_rule: "monthly" | "yearly" | string;
  /** extensão: mês do vencimento das contas anuais */
  due_month?: number | null;
  reminder_offsets: number[];
  /** extensão */
  payment_method?: string | null;
  notes?: string | null;
  active: boolean;
  /** extensão: primeiro mês em que a conta vence ("YYYY-MM-01") */
  starts_on?: ISODate;
}

export interface BillOccurrence {
  id: Id;
  household_id: Id;
  bill_id: Id;
  /** extensão: mês de referência ("YYYY-MM-01") */
  reference_month?: ISODate;
  due_date: ISODate;
  expected_amount: Cents;
  paid_amount: Cents | null;
  paid_at: ISODate | null;
  paid_by_member_id: Id | null;
  /** "atrasado" não é armazenado: é calculado a partir da data (PRD §4.1). */
  status: "pending" | "paid";
}

export interface Subscription {
  id: Id;
  household_id: Id;
  name: string;
  merchant_pattern: string;
  amount: Cents;
  billing_cycle: "monthly" | "yearly";
  next_charge_date: ISODate;
  /** null = débito/boleto: vira um pagamento próprio. Com cartão, só previsão (sem dupla contagem). */
  card_id: Id | null;
  owner_member_id: Id;
  category_id: Id | null;
  trial_ends_at: ISODate | null;
  status: "active" | "trial" | "cancelled";
}

export interface SubscriptionCharge {
  id: Id;
  household_id: Id;
  subscription_id: Id;
  /** null = pagamento fora do cartão (débito/boleto) registrado à mão */
  transaction_id: Id | null;
  charged_at: ISODate;
  amount: Cents;
}

export interface Goal {
  id: Id;
  household_id: Id;
  name: string;
  target_amount: Cents;
  target_date: ISODate | null;
  /** null = meta conjunta */
  owner_member_id: Id | null;
  icon: string | null;
  status: "active" | "paused" | "completed";
}

export interface GoalContribution {
  id: Id;
  household_id: Id;
  goal_id: Id;
  member_id: Id;
  amount: Cents;
  date: ISODate;
}

/** Calculado após cada importação (PRD §4.3b); não é tabela. */
export interface SubscriptionSuggestion {
  merchant_pattern: string;
  amount: Cents;
  last_charged_at: ISODate;
  card_id: Id | null;
}

/** Tudo o que a tela de Finanças lê de uma casa. */
export interface FinanceData {
  household: Household;
  members: Member[];
  categories: Category[];
  cards: Card[];
  statements: Statement[];
  transactions: Transaction[];
  bills: Bill[];
  bill_occurrences: BillOccurrence[];
  subscriptions: Subscription[];
  subscription_charges: SubscriptionCharge[];
  goals: Goal[];
  goal_contributions: GoalContribution[];
  subscription_suggestions: SubscriptionSuggestion[];
}
