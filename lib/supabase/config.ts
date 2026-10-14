/**
 * Configuração pública do Supabase. Sem as variáveis, o app roda em modo
 * demonstração (dados fictícios, sem login) — útil para ver telas sem banco.
 */
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

/** Endereço base para links enviados por e-mail ou copiados (login, convite). */
export function getSiteUrl(fallbackOrigin?: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackOrigin ?? "http://localhost:3000").replace(/\/$/, "");
}
