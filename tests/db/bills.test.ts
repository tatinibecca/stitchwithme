import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { billDueDate } from "@/lib/bills/recurrence";
import { asUser, canConnect, createTestDatabase, createUser } from "./harness";

const available = await canConnect();

describe.skipIf(!available)("Fase 2 · contas fixas e ocorrências", () => {
  let db: Client;
  let becca: string;
  let thiago: string;
  let intrusa: string;
  let casa: string;
  let beccaMember: string;
  let thiagoMember: string;
  let moradia: string;

  const q = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows as T[];
  const one = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => (await q<T>(sql, params))[0];

  async function createBill(user: string, fields: Record<string, unknown>) {
    const cols = Object.keys(fields);
    const sql = `insert into public.bills (${cols.join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning id`;
    return asUser(db, user, async () => (await one<{ id: string }>(sql, Object.values(fields))).id);
  }

  beforeAll(async () => {
    db = await createTestDatabase();
    becca = await createUser(db, "becca@example.com");
    thiago = await createUser(db, "thiago@example.com");
    intrusa = await createUser(db, "intrusa@example.com");
    casa = await asUser(db, becca, async () => (await one<{ id: string }>("select public.create_household('Casa', 'Becca') as id")).id);
    const token = await asUser(db, becca, async () => (await one<{ t: string }>("select public.create_household_invite() as t")).t);
    await asUser(db, thiago, () => q("select public.accept_household_invite($1, 'Thiago')", [token]));
    await asUser(db, intrusa, () => q("select public.create_household('Outra', 'Intrusa')"));
    beccaMember = (await one<{ id: string }>("select id from public.members where user_id = $1", [becca])).id;
    thiagoMember = (await one<{ id: string }>("select id from public.members where user_id = $1", [thiago])).id;
    moradia = (await one<{ id: string }>("select id from public.categories where household_id = $1 and name = 'Moradia'", [casa])).id;
  });

  afterAll(async () => {
    await db?.end();
  });

  it("toda casa nova ganha as 12 categorias padrão", async () => {
    const rows = await asUser(db, becca, () => q("select name from public.categories"));
    expect(rows).toHaveLength(12);
  });

  describe("datas: banco e app concordam", () => {
    const cases: [number, string, number | null, string, string][] = [
      [10, "monthly", null, "2026-01-01", "2026-10"],
      [31, "monthly", null, "2026-01-01", "2026-11"],
      [31, "monthly", null, "2026-01-01", "2026-02"],
      [30, "monthly", null, "2026-01-01", "2028-02"],
      [15, "yearly", 3, "2026-01-01", "2027-03"],
      [15, "yearly", 3, "2026-01-01", "2027-04"],
      [5, "monthly", null, "2026-10-01", "2026-09"],
    ];
    it.each(cases)("dia %i, %s, mês anual %s, início %s, em %s", async (day, rule, dueMonth, startsOn, month) => {
      const { d } = await one<{ d: string | null }>("select public.bill_due_date($1, $2, $3, $4::date, $5::date) as d", [
        day, rule, dueMonth, startsOn, `${month}-01`,
      ]);
      expect(d).toBe(billDueDate({ due_day: day, recurrence_rule: rule, due_month: dueMonth, starts_on: startsOn }, month));
    });
  });

  describe("cadastro e geração do mês", () => {
    let aluguel: string;
    let luz: string;

    beforeAll(async () => {
      aluguel = await createBill(becca, {
        household_id: casa, name: "Aluguel", category_id: moradia, owner_member_id: beccaMember,
        amount: 285000, due_day: 31, starts_on: "2026-10-01",
      });
      luz = await createBill(thiago, {
        household_id: casa, name: "Luz", category_id: moradia, owner_member_id: thiagoMember,
        amount: 21137, is_estimated: true, due_day: 10, starts_on: "2026-10-01",
      });
      await createBill(becca, {
        household_id: casa, name: "IPVA", owner_member_id: beccaMember, amount: 180000,
        due_day: 15, recurrence_rule: "yearly", due_month: 3, starts_on: "2026-10-01",
      });
    });

    it("gera as ocorrências do mês uma vez só (idempotente)", async () => {
      const first = await asUser(db, becca, async () => (await one<{ n: number }>("select public.generate_bill_occurrences('2026-11-01') as n")).n);
      const again = await asUser(db, thiago, async () => (await one<{ n: number }>("select public.generate_bill_occurrences('2026-11-15') as n")).n);
      expect(first).toBe(2); // aluguel e luz; IPVA só em março
      expect(again).toBe(0);
      const rows = await asUser(db, becca, () =>
        q<{ due_date: string }>("select due_date from public.bill_occurrences where bill_id = $1", [aluguel]),
      );
      expect(rows[0].due_date).toBe("2026-11-30"); // dia 31 → 30
    });

    it("conta anual só aparece no mês dela", async () => {
      const n = await asUser(db, becca, async () => (await one<{ n: number }>("select public.generate_bill_occurrences('2027-03-01') as n")).n);
      expect(n).toBe(3);
    });

    it("marcar como paga registra valor real, data e quem marcou", async () => {
      const occ = await one<{ id: string }>("select id from public.bill_occurrences where bill_id = $1 and reference_month = '2026-11-01'", [luz]);
      await asUser(db, becca, () => q("select public.mark_bill_occurrence_paid($1, 23410, '2026-10-12')", [occ.id]));
      const row = await one("select status, paid_amount, paid_by_member_id from public.bill_occurrences where id = $1", [occ.id]);
      expect(row).toEqual({ status: "paid", paid_amount: 23410, paid_by_member_id: beccaMember });
    });

    it("desfazer volta a ocorrência para a pagar", async () => {
      const occ = await one<{ id: string }>("select id from public.bill_occurrences where bill_id = $1 and reference_month = '2026-11-01'", [luz]);
      await asUser(db, thiago, () => q("select public.unmark_bill_occurrence_paid($1)", [occ.id]));
      const row = await one("select status, paid_amount from public.bill_occurrences where id = $1", [occ.id]);
      expect(row).toEqual({ status: "pending", paid_amount: null });
    });

    it("valor zero ou negativo é recusado", async () => {
      const occ = await one<{ id: string }>("select id from public.bill_occurrences where bill_id = $1 limit 1", [luz]);
      await expect(asUser(db, becca, () => q("select public.mark_bill_occurrence_paid($1, 0, '2026-10-12')", [occ.id]))).rejects.toThrow(/invalid_amount/);
    });

    it("ninguém grava ocorrência direto na tabela", async () => {
      await expect(
        asUser(db, becca, () => q("update public.bill_occurrences set status = 'paid'")),
      ).rejects.toThrow(/permission denied/);
    });

    it("edição 'só esta' muda só a ocorrência", async () => {
      await asUser(db, becca, () => q("select public.generate_bill_occurrences('2026-12-01')"));
      const nov = await one<{ id: string }>("select id from public.bill_occurrences where bill_id = $1 and reference_month = '2026-11-01'", [aluguel]);
      await asUser(db, becca, () => q("select public.update_bill_occurrence($1, 300000, '2026-11-25')", [nov.id]));
      const rows = await q<{ m: string; expected_amount: number }>(
        "select reference_month as m, expected_amount from public.bill_occurrences where bill_id = $1 order by reference_month", [aluguel],
      );
      expect(rows.map((r) => r.expected_amount)).toEqual([300000, 285000, 285000]); // nov, dez, mar
      const bill = await one<{ amount: number }>("select amount from public.bills where id = $1", [aluguel]);
      expect(bill.amount).toBe(285000);
    });

    it("'só esta' não aceita data em outro mês", async () => {
      const nov = await one<{ id: string }>("select id from public.bill_occurrences where bill_id = $1 and reference_month = '2026-11-01'", [aluguel]);
      await expect(
        asUser(db, becca, () => q("select public.update_bill_occurrence($1, 300000, '2026-12-02')", [nov.id])),
      ).rejects.toThrow(/occurrence_not_editable/);
    });

    it("edição 'esta e as próximas' muda a conta e as ocorrências a partir do mês, sem mexer no passado nem nas pagas", async () => {
      const dez = await one<{ id: string }>("select id from public.bill_occurrences where bill_id = $1 and reference_month = '2026-12-01'", [aluguel]);
      await asUser(db, becca, async () => {
        await q("update public.bills set amount = 299000, due_day = 5 where id = $1", [aluguel]);
        await q("select public.reapply_bill_from($1, '2026-12-01')", [aluguel]);
      });
      const rows = await q<{ expected_amount: number; due_date: string }>(
        "select expected_amount, due_date from public.bill_occurrences where bill_id = $1 order by reference_month", [aluguel],
      );
      expect(rows.map((r) => r.expected_amount)).toEqual([300000, 299000, 299000]); // nov fica, dez e mar mudam
      expect(rows[1].due_date).toBe("2026-12-05");
      expect(dez.id).toBeTruthy();
    });
  });

  describe("isolamento entre casas", () => {
    it("outra casa não vê contas nem ocorrências", async () => {
      const bills = await asUser(db, intrusa, () => q("select * from public.bills"));
      const occ = await asUser(db, intrusa, () => q("select * from public.bill_occurrences"));
      const cats = await asUser(db, intrusa, () => q("select * from public.categories where household_id = $1", [casa]));
      expect(bills).toEqual([]);
      expect(occ).toEqual([]);
      expect(cats).toEqual([]);
    });

    it("não cadastra conta na casa de outra pessoa", async () => {
      const intrusaMember = (await one<{ id: string }>("select id from public.members where user_id = $1", [intrusa])).id;
      await expect(
        createBill(intrusa, { household_id: casa, name: "X", owner_member_id: intrusaMember, amount: 100, due_day: 1 }),
      ).rejects.toThrow(/row-level security/);
    });

    it("não usa como responsável alguém de outra casa", async () => {
      const intrusaMember = (await one<{ id: string }>("select id from public.members where user_id = $1", [intrusa])).id;
      await expect(
        createBill(becca, { household_id: casa, name: "X", owner_member_id: intrusaMember, amount: 100, due_day: 1 }),
      ).rejects.toThrow(/row-level security/);
    });

    it("não marca como paga a conta de outra casa", async () => {
      const occ = await one<{ id: string }>("select id from public.bill_occurrences limit 1");
      await expect(
        asUser(db, intrusa, () => q("select public.mark_bill_occurrence_paid($1, 100, '2026-10-12')", [occ.id])),
      ).rejects.toThrow(/occurrence_not_found/);
    });
  });
});
