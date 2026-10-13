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

const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: TIME_ZONE });

/** "2026-10" → "Outubro de 2026" */
export function formatMonthYear(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const label = monthYear.format(new Date(Date.UTC(y, m - 1, 15, 12)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2027-07-31" → "jul/2027" */
export function formatShortMonthYear(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: TIME_ZONE })
    .format(new Date(Date.UTC(y, m - 1, 15, 12)))
    .replace(".", "");
  return `${month}/${y}`;
}
