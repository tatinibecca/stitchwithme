import { describe, expect, it } from "vitest";
import { GENERIC_ERROR, friendlyDbError, safeNextPath, validateEmail, validateName } from "./errors";

describe("friendlyDbError", () => {
  it("traduz os erros conhecidos do banco", () => {
    expect(friendlyDbError({ message: "invite_expired" })).toMatch(/expirou/);
    expect(friendlyDbError({ message: 'P0001: already_member' })).toMatch(/já faz parte/);
  });

  it("nunca mostra a mensagem técnica crua", () => {
    expect(friendlyDbError({ message: "duplicate key value violates unique constraint" })).toBe(GENERIC_ERROR);
    expect(friendlyDbError(null)).toBe(GENERIC_ERROR);
  });
});

describe("safeNextPath", () => {
  it("aceita caminhos internos", () => {
    expect(safeNextPath("/convite/abc")).toBe("/convite/abc");
  });

  it("bloqueia redirecionamento para outro site", () => {
    expect(safeNextPath("https://malicioso.com")).toBe("/financas");
    expect(safeNextPath("//malicioso.com")).toBe("/financas");
    expect(safeNextPath("/\\malicioso.com")).toBe("/financas");
    expect(safeNextPath(undefined)).toBe("/financas");
  });
});

describe("validação de formulários", () => {
  it("nome: obrigatório, sem espaços sobrando e com limite", () => {
    expect(validateName("  Casa   da Becca ", "o nome da casa", 60)).toEqual({ value: "Casa da Becca" });
    expect(validateName("   ", "o nome da casa", 60)).toEqual({ error: "Informe o nome da casa." });
    expect(validateName("x".repeat(61), "o nome da casa", 60)).toEqual({ error: "Use no máximo 60 caracteres." });
  });

  it("e-mail", () => {
    expect(validateEmail(" Becca@Exemplo.com ")).toEqual({ value: "becca@exemplo.com" });
    expect("error" in validateEmail("becca@")).toBe(true);
    expect("error" in validateEmail("")).toBe(true);
  });
});
