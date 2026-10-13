import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio, parseHex } from "./contrast";

describe("contrastRatio", () => {
  it("preto sobre branco é 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("é simétrico", () => {
    expect(contrastRatio("#ff5a5f", "#222222")).toBeCloseTo(contrastRatio("#222222", "#ff5a5f"), 10);
  });

  it("bate com os valores publicados no design system", () => {
    expect(contrastRatio("#ffffff", "#ff5a5f")).toBeCloseTo(3.05, 2);
    expect(contrastRatio("#222222", "#ff5a5f")).toBeCloseTo(5.21, 2);
    expect(contrastRatio("#717171", "#ffffff")).toBeCloseTo(4.88, 2);
    expect(contrastRatio("#dddddd", "#ffffff")).toBeCloseTo(1.36, 2);
  });

  it("aceita hex curto", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
  });

  it("recusa cor inválida", () => {
    expect(() => parseHex("coral")).toThrow();
  });
});

describe("formatRatio", () => {
  it("arredonda para baixo para não aprovar 4.499 como 4.50", () => {
    expect(formatRatio(4.499)).toBe("4.49:1");
  });
});
