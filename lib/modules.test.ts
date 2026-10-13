import { describe, expect, it } from "vitest";
import { MODULES, findActiveModule, isSectionActive } from "./modules";

const financas = MODULES[0];
const [overview, contas] = financas.sections;

describe("navegação por módulos", () => {
  it("no MVP só existe o módulo Finanças, com até 5 seções (barra inferior)", () => {
    expect(MODULES.map((m) => m.id)).toEqual(["financas"]);
    expect(financas.sections.length).toBeLessThanOrEqual(5);
  });

  it("a visão do mês só fica ativa na rota exata", () => {
    expect(isSectionActive("/financas", overview, financas)).toBe(true);
    expect(isSectionActive("/financas/contas", overview, financas)).toBe(false);
  });

  it("uma seção fica ativa nas sub-rotas", () => {
    expect(isSectionActive("/financas/contas/123", contas, financas)).toBe(true);
    expect(isSectionActive("/financas/contasx", contas, financas)).toBe(false);
  });

  it("encontra o módulo ativo pela rota", () => {
    expect(findActiveModule("/financas/metas").id).toBe("financas");
  });
});
