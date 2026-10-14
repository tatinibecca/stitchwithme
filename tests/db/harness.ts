import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Client, types } from "pg";

// Datas (tipo date) chegam como "YYYY-MM-DD", sem conversão de fuso.
types.setTypeParser(1082, (value) => value);

/**
 * Banco de teste descartável. Por padrão usa o Postgres do `npx supabase start`
 * (porta 54322). Sobrescreva com TEST_DATABASE_URL.
 */
export const ADMIN_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const TEST_DB = "casita_rls_test";

export async function canConnect(): Promise<boolean> {
  const client = new Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

/** Recria o banco de teste e aplica o shim do Supabase + todas as migrations, em ordem. */
export async function createTestDatabase(): Promise<Client> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${TEST_DB} with (force)`);
  await admin.query(`create database ${TEST_DB}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = `/${TEST_DB}`;
  const db = new Client({ connectionString: url.toString() });
  await db.connect();

  await db.query(readFileSync(join(__dirname, "supabase-shim.sql"), "utf8"));
  const dir = join(__dirname, "../../supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.query(readFileSync(join(dir, file), "utf8"));
  }
  return db;
}

export async function createUser(db: Client, email: string): Promise<string> {
  const id = randomUUID();
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  return id;
}

/**
 * Roda `fn` como um usuário logado (papel authenticated + JWT com sub) ou como
 * visitante (anon, userId null), numa transação. Erro do banco desfaz e é relançado.
 */
export async function asUser<T>(db: Client, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    await db.query(`set local role ${userId ? "authenticated" : "anon"}`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      userId ? JSON.stringify({ sub: userId, role: "authenticated" }) : "",
    ]);
    const result = await fn();
    await db.query("commit");
    return result;
  } catch (error) {
    await db.query("rollback");
    throw error;
  }
}
