/**
 * Converte o que a pessoa digita ("1.234,56", "211,37", "80") em centavos inteiros.
 * Devolve null se não for um valor válido. Nunca usa float para o valor final.
 */
export function parseBRLToCents(input: string): number | null {
  const text = input.replace(/\s|R\$/g, "");
  if (!text) return null;
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(text)) return null;
  const [intPart, decPart = ""] = text.replace(/\./g, "").split(",");
  const cents = Number(intPart) * 100 + Number(decPart.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

/** 123456 → "1.234,56" (para preencher campos de valor) */
export function centsToInput(cents: number): string {
  const reais = Math.floor(cents / 100).toLocaleString("pt-BR");
  return `${reais},${String(cents % 100).padStart(2, "0")}`;
}
