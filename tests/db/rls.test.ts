import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, canConnect, createTestDatabase, createUser } from "./harness";

const available = await canConnect();
if (!available) {
  console.warn("[test:db] Postgres não encontrado: rode `npx supabase start` ou defina TEST_DATABASE_URL.");
}

describe.skipIf(!available)("RLS · casa, membros, pessoas e convites", () => {
  let db: Client;
  let becca: string;
  let thiago: string;
  let intrusa: string;
  let semCasa: string;
  let casaBecca: string;
  let casaIntrusa: string;

  const q = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    (await db.query(sql, params)).rows as T[];

  beforeAll(async () => {
    db = await createTestDatabase();
    becca = await createUser(db, "becca@example.com");
    thiago = await createUser(db, "thiago@example.com");
    intrusa = await createUser(db, "intrusa@example.com");
    semCasa = await createUser(db, "semcasa@example.com");

    casaBecca = await asUser(db, becca, async () =>
      (await q<{ id: string }>("select public.create_household('Casa da Becca', 'Becca') as id"))[0].id,
    );
    casaIntrusa = await asUser(db, intrusa, async () =>
      (await q<{ id: string }>("select public.create_household('Outra casa', 'Intrusa') as id"))[0].id,
    );
  });

  afterAll(async () => {
    await db?.end();
  });

  describe("criar casa", () => {
    it("cria a casa, o membro dono e a pessoa ligada a ele", async () => {
      const rows = await asUser(db, becca, () =>
        q("select m.role, p.display_name from public.members m join public.people p on p.member_id = m.id"),
      );
      expect(rows).toEqual([{ role: "owner", display_name: "Becca" }]);
    });

    it("não deixa criar uma segunda casa", async () => {
      await expect(asUser(db, becca, () => q("select public.create_household('Outra', 'Becca')"))).rejects.toThrow(
        /already_member/,
      );
    });

    it("visitante sem login não cria casa", async () => {
      await expect(asUser(db, null, () => q("select public.create_household('X', 'Y')"))).rejects.toThrow(
        /permission denied/,
      );
    });
  });

  describe("isolamento entre casas", () => {
    it("cada um só vê a própria casa", async () => {
      const daBecca = await asUser(db, becca, () => q<{ id: string }>("select id from public.households"));
      const daIntrusa = await asUser(db, intrusa, () => q<{ id: string }>("select id from public.households"));
      expect(daBecca.map((r) => r.id)).toEqual([casaBecca]);
      expect(daIntrusa.map((r) => r.id)).toEqual([casaIntrusa]);
    });

    it("não lê membros nem pessoas de outra casa", async () => {
      const members = await asUser(db, intrusa, () => q("select * from public.members where household_id = $1", [casaBecca]));
      const people = await asUser(db, intrusa, () => q("select * from public.people where household_id = $1", [casaBecca]));
      expect(members).toEqual([]);
      expect(people).toEqual([]);
    });

    it("não renomeia a casa de outra pessoa", async () => {
      await asUser(db, intrusa, () => q("update public.households set name = 'Invadida' where id = $1", [casaBecca]));
      const [row] = await q<{ name: string }>("select name from public.households where id = $1", [casaBecca]);
      expect(row.name).toBe("Casa da Becca");
    });

    it("não cadastra pessoa em outra casa", async () => {
      await expect(
        asUser(db, intrusa, () =>
          q("insert into public.people (household_id, display_name) values ($1, 'Infiltrada')", [casaBecca]),
        ),
      ).rejects.toThrow(/row-level security/);
    });

    it("quem ainda não tem casa não vê nada", async () => {
      const rows = await asUser(db, semCasa, () => q("select * from public.households"));
      expect(rows).toEqual([]);
    });

    it("visitante sem login não lê nenhuma tabela", async () => {
      await expect(asUser(db, null, () => q("select * from public.households"))).rejects.toThrow(/permission denied/);
      await expect(asUser(db, null, () => q("select * from public.people"))).rejects.toThrow(/permission denied/);
    });
  });

  describe("convite", () => {
    let token: string;

    it("a dona da casa gera um convite e o banco guarda só o hash", async () => {
      token = await asUser(db, becca, async () => (await q<{ t: string }>("select public.create_household_invite() as t"))[0].t);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
      const stored = await q<{ token_hash: string }>("select token_hash from public.household_invites");
      expect(stored.some((r) => r.token_hash === token)).toBe(false);
    });

    it("membro não consegue ler o hash do convite", async () => {
      await expect(asUser(db, becca, () => q("select token_hash from public.household_invites"))).rejects.toThrow(
        /permission denied/,
      );
    });

    it("a prévia mostra a casa e quem convidou", async () => {
      const [preview] = await asUser(db, thiago, () => q("select * from public.get_household_invite($1)", [token]));
      expect(preview).toEqual({ household_name: "Casa da Becca", invited_by: "Becca", status: "valid" });
    });

    it("token errado não revela nada", async () => {
      const [preview] = await asUser(db, thiago, () => q("select * from public.get_household_invite('nao-existe')"));
      expect(preview).toEqual({ household_name: null, invited_by: null, status: "not_found" });
    });

    it("quem já tem outra casa não aceita o convite", async () => {
      await expect(
        asUser(db, intrusa, () => q("select public.accept_household_invite($1, 'Intrusa')", [token])),
      ).rejects.toThrow(/already_member/);
    });

    it("Thiago entra pelo convite e vê os mesmos dados da Becca", async () => {
      await asUser(db, thiago, () => q("select public.accept_household_invite($1, 'Thiago')", [token]));
      const casas = await asUser(db, thiago, () => q<{ id: string }>("select id from public.households"));
      const pessoas = await asUser(db, thiago, () =>
        q<{ display_name: string }>("select display_name from public.people order by display_name"),
      );
      expect(casas.map((r) => r.id)).toEqual([casaBecca]);
      expect(pessoas.map((r) => r.display_name)).toEqual(["Becca", "Thiago"]);
    });

    it("o convite não pode ser usado de novo por outra pessoa", async () => {
      await expect(
        asUser(db, semCasa, () => q("select public.accept_household_invite($1, 'Alguém')", [token])),
      ).rejects.toThrow(/invite_used/);
    });

    it("convite expirado é recusado", async () => {
      const expired = await asUser(db, becca, async () => (await q<{ t: string }>("select public.create_household_invite() as t"))[0].t);
      await q("update public.household_invites set expires_at = now() - interval '1 minute' where token_hash = encode(sha256(convert_to($1, 'UTF8')), 'hex')", [expired]);
      await expect(
        asUser(db, semCasa, () => q("select public.accept_household_invite($1, 'Alguém')", [expired])),
      ).rejects.toThrow(/invite_expired/);
    });

    it("convite revogado é recusado", async () => {
      const revoked = await asUser(db, becca, async () => (await q<{ t: string }>("select public.create_household_invite() as t"))[0].t);
      await asUser(db, becca, () =>
        q("update public.household_invites set revoked_at = now() where accepted_at is null and revoked_at is null and expires_at > now()"),
      );
      await expect(
        asUser(db, semCasa, () => q("select public.accept_household_invite($1, 'Alguém')", [revoked])),
      ).rejects.toThrow(/invite_revoked/);
    });
  });

  describe("pessoas sem login", () => {
    it("membro cadastra a Martha e o outro membro também a vê", async () => {
      await asUser(db, becca, () => q("insert into public.people (household_id, display_name) values ($1, 'Martha')", [casaBecca]));
      const rows = await asUser(db, thiago, () =>
        q<{ display_name: string; member_id: string | null }>("select display_name, member_id from public.people where display_name = 'Martha'"),
      );
      expect(rows).toEqual([{ display_name: "Martha", member_id: null }]);
    });

    it("não dá para ligar uma pessoa a um membro pela API", async () => {
      await expect(
        asUser(db, becca, () =>
          q("insert into public.people (household_id, member_id, display_name) values ($1, gen_random_uuid(), 'X')", [casaBecca]),
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it("pessoa ligada a um membro não pode ser apagada; a Martha pode", async () => {
      await asUser(db, becca, () => q("delete from public.people where household_id = $1", [casaBecca]));
      const rows = await asUser(db, becca, () => q<{ display_name: string }>("select display_name from public.people order by 1"));
      expect(rows.map((r) => r.display_name)).toEqual(["Becca", "Thiago"]);
    });

    it("cada membro só muda o próprio nome", async () => {
      await asUser(db, thiago, () => q("update public.members set display_name = 'Hackeado'"));
      const rows = await asUser(db, becca, () => q<{ display_name: string }>("select display_name from public.members order by 1"));
      expect(rows.map((r) => r.display_name)).toEqual(["Becca", "Hackeado"]);
    });

    it("membro não pode se promover a dono", async () => {
      await expect(asUser(db, thiago, () => q("update public.members set role = 'owner'"))).rejects.toThrow(
        /permission denied/,
      );
    });
  });
});
