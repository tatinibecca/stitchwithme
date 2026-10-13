/**
 * Dados fictícios da casa de Becca e Thiago — outubro de 2026.
 * Mesmo formato das tabelas do PRD §6 (ver ./types.ts). Valores em centavos.
 *
 * Cenário em 13/10/2026 ("hoje" do mock):
 * - 8 contas fixas, 4 de cada um; 2 atrasadas (condomínio e luz), 3 pagas.
 * - 2 cartões com fatura do mês. A do Itaú tem o valor alto (R$ 12.345,67).
 * - 10 assinaturas: 6 no cartão, 3 em débito/boleto, 1 em teste grátis.
 *   Uma tem nome longo de estabelecimento (clube de vinhos).
 * - 3 metas com progressos diferentes (15%, 52%, 92%).
 * Invariante: o total de cada fatura é a soma das suas transações.
 */
import type {
  Bill,
  BillOccurrence,
  Card,
  Category,
  FinanceData,
  Goal,
  GoalContribution,
  ISODate,
  Member,
  Statement,
  Subscription,
  SubscriptionCharge,
  Transaction,
} from "./types";

export const MOCK_TODAY: ISODate = "2026-10-13";

const H = "hh_casa";
const BECCA = "mem_becca";
const THIAGO = "mem_thiago";
const NUBANK = "card_nubank";
const ITAU = "card_itau";
const ST_NUBANK = "st_nubank_2026_10";
const ST_ITAU = "st_itau_2026_10";

const members: Member[] = [
  { id: BECCA, household_id: H, user_id: "usr_becca", display_name: "Becca", role: "owner" },
  { id: THIAGO, household_id: H, user_id: "usr_thiago", display_name: "Thiago", role: "member" },
];

const CATEGORY_NAMES: [string, string][] = [
  ["cat_moradia", "Moradia"],
  ["cat_mercado", "Mercado"],
  ["cat_alimentacao", "Alimentação fora"],
  ["cat_transporte", "Transporte/Carro"],
  ["cat_saude", "Saúde"],
  ["cat_pets", "Pets"],
  ["cat_lazer", "Lazer"],
  ["cat_viagens", "Viagens"],
  ["cat_assinaturas", "Assinaturas"],
  ["cat_compras", "Compras"],
  ["cat_educacao", "Educação"],
  ["cat_outros", "Outros"],
];

const categories: Category[] = CATEGORY_NAMES.map(([id, name]) => ({
  id,
  household_id: H,
  name,
  icon: null,
  color: null,
  is_default: true,
}));

const cards: Card[] = [
  {
    id: NUBANK,
    household_id: H,
    owner_member_id: BECCA,
    name: "Nubank",
    bank: "Nu Pagamentos",
    last4: "4821",
    closing_day: 7,
    due_day: 17,
    csv_mapping: { date: "date", description: "title", amount: "amount" },
  },
  {
    id: ITAU,
    household_id: H,
    owner_member_id: THIAGO,
    name: "Itaú",
    bank: "Itaú Unibanco",
    last4: "0937",
    closing_day: 8,
    due_day: 18,
    csv_mapping: { date: "data", description: "lançamento", amount: "valor", installment: "parcela" },
  },
];

const statements: Statement[] = [
  {
    id: ST_NUBANK,
    household_id: H,
    card_id: NUBANK,
    reference_month: "2026-10",
    due_date: "2026-10-17",
    total_amount: 137322,
    import_batch_id: "batch_nubank_2026_10",
    status: "open",
    paid_at: null,
    paid_by_member_id: null,
  },
  {
    id: ST_ITAU,
    household_id: H,
    card_id: ITAU,
    reference_month: "2026-10",
    due_date: "2026-10-18",
    total_amount: 1234567,
    import_batch_id: "batch_itau_2026_10",
    status: "open",
    paid_at: null,
    paid_by_member_id: null,
  },
];

function tx(
  id: string,
  statement: typeof ST_NUBANK | typeof ST_ITAU,
  date: ISODate,
  raw: string,
  amount: number,
  category: string,
  installment?: [number, number],
): Transaction {
  const card_id = statement === ST_NUBANK ? NUBANK : ITAU;
  const normalized = raw
    .toLowerCase()
    .replace(/\d{2}\/\d{2}$/, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    id,
    household_id: H,
    card_id,
    statement_id: statement,
    date,
    description_raw: raw,
    description_normalized: normalized,
    amount,
    installment_current: installment?.[0] ?? null,
    installment_total: installment?.[1] ?? null,
    category_id: category,
    import_batch_id: statement === ST_NUBANK ? "batch_nubank_2026_10" : "batch_itau_2026_10",
    dedupe_hash: `${card_id}|${date}|${amount}|${normalized}`,
  };
}

const transactions: Transaction[] = [
  // Nubank — período 08/09 a 07/10, total R$ 1.373,22
  tx("tx_nu_01", ST_NUBANK, "2026-09-09", "PAO DE ACUCAR 1234", 48732, "cat_mercado"),
  tx("tx_nu_02", ST_NUBANK, "2026-09-12", "IFD*IFOOD", 8790, "cat_alimentacao"),
  tx("tx_nu_03", ST_NUBANK, "2026-09-14", "UBER *TRIP", 3450, "cat_transporte"),
  tx("tx_nu_04", ST_NUBANK, "2026-09-16", "DROGARIA SAO PAULO", 12690, "cat_saude"),
  tx("tx_nu_05", ST_NUBANK, "2026-09-18", "SPOTIFY", 4090, "cat_assinaturas"),
  tx("tx_nu_06", ST_NUBANK, "2026-09-21", "APPLE.COM/BILL", 1490, "cat_assinaturas"),
  tx("tx_nu_07", ST_NUBANK, "2026-09-23", "ZARA BRASIL 02/03", 32990, "cat_compras", [2, 3]),
  tx("tx_nu_08", ST_NUBANK, "2026-09-27", "CINEMARK", 9600, "cat_lazer"),
  tx("tx_nu_09", ST_NUBANK, "2026-10-02", "PETZ", 21480, "cat_pets"),
  tx("tx_nu_10", ST_NUBANK, "2026-10-04", "ESTORNO ZARA BRASIL", -5990, "cat_compras"),
  // Itaú — período 09/09 a 08/10, total R$ 12.345,67
  tx("tx_it_01", ST_ITAU, "2026-09-10", "FAST SHOP", 459900, "cat_compras"),
  tx("tx_it_02", ST_ITAU, "2026-09-12", "CLUBE VINHOS QUEIJOS SERRA GAUCHA", 18990, "cat_assinaturas"),
  tx("tx_it_03", ST_ITAU, "2026-09-15", "LATAM AIRLINES 01/04", 320000, "cat_viagens", [1, 4]),
  tx("tx_it_04", ST_ITAU, "2026-09-17", "ASSAI ATACADISTA", 87645, "cat_mercado"),
  tx("tx_it_05", ST_ITAU, "2026-09-20", "SHELL BOX", 28990, "cat_transporte"),
  tx("tx_it_06", ST_ITAU, "2026-09-22", "OUTBACK", 24760, "cat_alimentacao"),
  tx("tx_it_07", ST_ITAU, "2026-09-25", "LEROY MERLIN", 156300, "cat_moradia"),
  tx("tx_it_08", ST_ITAU, "2026-09-27", "NETFLIX.COM", 4490, "cat_assinaturas"),
  tx("tx_it_09", ST_ITAU, "2026-09-30", "DECATHLON", 33492, "cat_lazer"),
  tx("tx_it_10", ST_ITAU, "2026-10-03", "DISNEY PLUS", 4390, "cat_assinaturas"),
  tx("tx_it_11", ST_ITAU, "2026-10-06", "MERCADOLIVRE*3 ITENS", 95610, "cat_compras"),
];

function bill(
  id: string,
  name: string,
  owner: string,
  amount: number,
  due_day: number,
  category: string,
  is_estimated = false,
): Bill {
  return {
    id,
    household_id: H,
    name,
    category_id: category,
    owner_member_id: owner,
    amount,
    is_estimated,
    due_day,
    recurrence_rule: "monthly",
    reminder_offsets: [3, 0],
    active: true,
  };
}

const bills: Bill[] = [
  bill("bill_aluguel", "Aluguel", BECCA, 285000, 20, "cat_moradia"),
  bill("bill_condominio", "Condomínio", THIAGO, 78000, 5, "cat_moradia"),
  bill("bill_luz", "Luz", BECCA, 21137, 10, "cat_moradia", true),
  bill("bill_agua", "Água", BECCA, 9640, 8, "cat_moradia", true),
  bill("bill_internet", "Internet", THIAGO, 11990, 15, "cat_moradia"),
  bill("bill_gas", "Gás", THIAGO, 3800, 9, "cat_moradia", true),
  bill("bill_celular", "Celular", BECCA, 5999, 12, "cat_outros"),
  bill("bill_seguro", "Seguro do carro", THIAGO, 31250, 30, "cat_transporte"),
];

function occurrence(
  billId: string,
  paid?: { amount: number; at: ISODate; by: string },
): BillOccurrence {
  const b = bills.find((x) => x.id === billId)!;
  return {
    id: `occ_${billId.replace("bill_", "")}_2026_10`,
    household_id: H,
    bill_id: billId,
    due_date: `2026-10-${String(b.due_day).padStart(2, "0")}`,
    expected_amount: b.amount,
    paid_amount: paid?.amount ?? null,
    paid_at: paid?.at ?? null,
    paid_by_member_id: paid?.by ?? null,
    status: paid ? "paid" : "pending",
  };
}

const bill_occurrences: BillOccurrence[] = [
  occurrence("bill_aluguel"),
  occurrence("bill_condominio"),
  occurrence("bill_luz"),
  // Água e gás têm valor estimado: o valor pago real é diferente do previsto.
  occurrence("bill_agua", { amount: 9318, at: "2026-10-07", by: BECCA }),
  occurrence("bill_internet"),
  occurrence("bill_gas", { amount: 4120, at: "2026-10-09", by: THIAGO }),
  // Conta da Becca marcada como paga pelo Thiago (os dois podem marcar).
  occurrence("bill_celular", { amount: 5999, at: "2026-10-11", by: THIAGO }),
  occurrence("bill_seguro"),
];

function sub(
  id: string,
  name: string,
  owner: string,
  amount: number,
  next_charge_date: ISODate,
  card_id: string | null,
  extra: Partial<Subscription> = {},
): Subscription {
  return {
    id,
    household_id: H,
    name,
    merchant_pattern: name.toLowerCase(),
    amount,
    billing_cycle: "monthly",
    next_charge_date,
    card_id,
    owner_member_id: owner,
    category_id: "cat_assinaturas",
    trial_ends_at: null,
    status: "active",
    ...extra,
  };
}

const subscriptions: Subscription[] = [
  sub("sub_netflix", "Netflix", THIAGO, 4490, "2026-10-27", ITAU),
  sub("sub_spotify", "Spotify Família", BECCA, 4090, "2026-10-18", NUBANK),
  sub("sub_icloud", "iCloud+ 200 GB", BECCA, 1490, "2026-10-21", NUBANK),
  sub(
    "sub_vinhos",
    "Clube Vinhos & Queijos Artesanais da Serra Gaúcha – Plano Família",
    THIAGO,
    18990,
    "2026-10-12",
    ITAU,
    { merchant_pattern: "clube vinhos queijos serra gaucha" },
  ),
  sub("sub_prime", "Amazon Prime", BECCA, 16680, "2027-03-08", NUBANK, { billing_cycle: "yearly" }),
  sub("sub_disney", "Disney+", THIAGO, 4390, "2026-10-03", ITAU),
  sub("sub_youtube", "YouTube Premium", BECCA, 2690, "2026-10-15", null),
  sub("sub_duolingo", "Duolingo Super", BECCA, 5990, "2026-10-16", NUBANK, {
    status: "trial",
    trial_ends_at: "2026-10-16",
    category_id: "cat_educacao",
  }),
  sub("sub_smartfit", "Smart Fit", THIAGO, 14990, "2026-10-10", null, { category_id: "cat_saude" }),
  sub("sub_globoplay", "Globoplay", BECCA, 2490, "2026-10-05", null),
];

const subscription_charges: SubscriptionCharge[] = [
  // Conciliadas com transações das faturas
  { id: "chg_spotify_09", household_id: H, subscription_id: "sub_spotify", transaction_id: "tx_nu_05", charged_at: "2026-09-18", amount: 4090 },
  { id: "chg_icloud_09", household_id: H, subscription_id: "sub_icloud", transaction_id: "tx_nu_06", charged_at: "2026-09-21", amount: 1490 },
  { id: "chg_vinhos_09", household_id: H, subscription_id: "sub_vinhos", transaction_id: "tx_it_02", charged_at: "2026-09-12", amount: 18990 },
  { id: "chg_netflix_09", household_id: H, subscription_id: "sub_netflix", transaction_id: "tx_it_08", charged_at: "2026-09-27", amount: 4490 },
  { id: "chg_disney_10", household_id: H, subscription_id: "sub_disney", transaction_id: "tx_it_10", charged_at: "2026-10-03", amount: 4390 },
  // Fora do cartão (débito/boleto): pagamento do mês já registrado
  { id: "chg_globoplay_10", household_id: H, subscription_id: "sub_globoplay", transaction_id: null, charged_at: "2026-10-05", amount: 2490 },
  { id: "chg_smartfit_10", household_id: H, subscription_id: "sub_smartfit", transaction_id: null, charged_at: "2026-10-10", amount: 14990 },
];

const goals: Goal[] = [
  { id: "goal_lua_de_mel", household_id: H, name: "Lua de mel", target_amount: 2000000, target_date: "2027-07-31", owner_member_id: null, icon: "plane", status: "active" },
  { id: "goal_reserva", household_id: H, name: "Reserva de emergência", target_amount: 3000000, target_date: null, owner_member_id: null, icon: "shield", status: "active" },
  { id: "goal_sofa", household_id: H, name: "Sofá novo", target_amount: 450000, target_date: "2026-12-15", owner_member_id: BECCA, icon: "sofa", status: "active" },
];

const goal_contributions: GoalContribution[] = [
  { id: "gc_01", household_id: H, goal_id: "goal_lua_de_mel", member_id: BECCA, amount: 300000, date: "2026-06-05" },
  { id: "gc_02", household_id: H, goal_id: "goal_lua_de_mel", member_id: THIAGO, amount: 300000, date: "2026-07-05" },
  { id: "gc_03", household_id: H, goal_id: "goal_lua_de_mel", member_id: BECCA, amount: 220000, date: "2026-08-05" },
  { id: "gc_04", household_id: H, goal_id: "goal_lua_de_mel", member_id: THIAGO, amount: 220000, date: "2026-09-05" },
  { id: "gc_05", household_id: H, goal_id: "goal_reserva", member_id: THIAGO, amount: 250000, date: "2026-07-10" },
  { id: "gc_06", household_id: H, goal_id: "goal_reserva", member_id: BECCA, amount: 200000, date: "2026-09-10" },
  { id: "gc_07", household_id: H, goal_id: "goal_sofa", member_id: BECCA, amount: 414000, date: "2026-10-01" },
];

export const mockFinanceData: FinanceData = {
  household: { id: H, name: "Casa da Becca e do Thiago", created_at: "2026-05-20T12:00:00-03:00" },
  members,
  categories,
  cards,
  statements,
  transactions,
  bills,
  bill_occurrences,
  subscriptions,
  subscription_charges,
  goals,
  goal_contributions,
  subscription_suggestions: [
    { merchant_pattern: "uber one", amount: 990, last_charged_at: "2026-09-19", card_id: NUBANK },
    { merchant_pattern: "kindle unlimited", amount: 1990, last_charged_at: "2026-09-24", card_id: NUBANK },
    { merchant_pattern: "wellhub", amount: 8990, last_charged_at: "2026-09-29", card_id: ITAU },
  ],
};

/** Primeiro acesso: casa criada, Thiago já convidado, nada cadastrado. */
export const emptyFinanceData: FinanceData = {
  ...mockFinanceData,
  categories,
  cards: [],
  statements: [],
  transactions: [],
  bills: [],
  bill_occurrences: [],
  subscriptions: [],
  subscription_charges: [],
  goals: [],
  goal_contributions: [],
  subscription_suggestions: [],
};

export const MOCK_CURRENT_MEMBER_ID = BECCA;
