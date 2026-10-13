export const TIME_ZONE = "America/Sao_Paulo";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Formata centavos (inteiro) como moeda: 123456 → "R$ 1.234,56".
 * Valores monetários nunca são float — recusa entradas não inteiras.
 */
export function formatBRL(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new TypeError(`formatBRL espera centavos inteiros, recebeu ${cents}`);
  }
  return currency.format(cents / 100);
}

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: TIME_ZONE,
});

/** "2026-10-15" → "15 de out." — datas de calendário, sem deslocamento de fuso. */
export function formatDueDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Meio-dia UTC fica no mesmo dia em America/Sao_Paulo (UTC-3).
  return shortDate.format(new Date(Date.UTC(y, m - 1, d, 12)));
}
