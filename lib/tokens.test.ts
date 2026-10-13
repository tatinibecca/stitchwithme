import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTRAST_PAIRS, evaluateContrast, parseThemeTokens } from "./tokens";

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
const themes = parseThemeTokens(css);

describe("tokens de app/globals.css", () => {
  it("os temas claro e escuro definem as mesmas cores", () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
  });

  it("todo token usado nos pares existe nos dois temas", () => {
    const used = new Set(CONTRAST_PAIRS.flatMap((p) => [p.fg, p.bg]));
    for (const name of used) {
      expect(themes.light, `claro: --${name}`).toHaveProperty(name);
      expect(themes.dark, `escuro: --${name}`).toHaveProperty(name);
    }
  });

  describe.each(["light", "dark"] as const)("contraste WCAG AA — tema %s", (theme) => {
    const results = evaluateContrast(themes).filter((r) => r.theme === theme);

    it.each(results.map((r) => [`${r.fg} / ${r.bg} (${r.usage})`, r] as const))("%s", (_, r) => {
      expect(r.ratio, `${r.fgHex} sobre ${r.bgHex}`).toBeGreaterThanOrEqual(r.min);
    });
  });

  describe("regras da marca Casita", () => {
    it("coral nunca é cor de status nem de texto (não aparece em nenhum par)", () => {
      const used = CONTRAST_PAIRS.flatMap((p) => [p.fg, p.bg]);
      expect(used).not.toContain("brand-coral");
      for (const theme of ["light", "dark"] as const) {
        const coral = themes[theme]["brand-coral"];
        const statusValues = Object.entries(themes[theme])
          .filter(([name]) => name.startsWith("status-") || name === "destructive" || name === "primary")
          .map(([, value]) => value);
        expect(statusValues, `tema ${theme}`).not.toContain(coral);
      }
    });

    it("sálvia nunca é texto nem borda (só aparece como fundo)", () => {
      expect(CONTRAST_PAIRS.filter((p) => p.fg === "accent")).toEqual([]);
    });
  });
});
