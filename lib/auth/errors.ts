/** Traduz os erros estáveis das funções do banco para mensagens em pt-BR que dizem o que fazer. */
const MESSAGES: Record<string, string> = {
  not_authenticated: "Sua sessão expirou. Entre de novo para continuar.",
  already_member: "Sua conta já faz parte de uma casa. No momento, cada pessoa participa de uma casa só.",
  no_household: "Crie a sua casa antes de convidar alguém.",
  invite_not_found: "Este convite não existe. Peça um link novo para quem convidou você.",
  invite_used: "Este convite já foi usado. Peça um link novo para quem convidou você.",
  invite_expired: "Este convite expirou (vale por 7 dias). Peça um link novo para quem convidou você.",
  invite_revoked: "Este convite foi cancelado. Peça um link novo para quem convidou você.",
};

export const GENERIC_ERROR = "Não conseguimos concluir agora. Confira sua conexão e tente de novo.";

export function friendlyDbError(error: { message?: string } | null | undefined): string {
  if (!error?.message) return GENERIC_ERROR;
  const key = Object.keys(MESSAGES).find((k) => error.message!.includes(k));
  return key ? MESSAGES[key] : GENERIC_ERROR;
}

/** Só aceita caminhos internos em ?next=, para não virar um redirecionamento aberto. */
export function safeNextPath(next: unknown, fallback = "/financas"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

export function validateName(value: unknown, label: string, max: number): { value: string } | { error: string } {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!text) return { error: `Informe ${label}.` };
  if (text.length > max) return { error: `Use no máximo ${max} caracteres.` };
  return { value: text };
}

export function validateEmail(value: unknown): { value: string } | { error: string } {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!text) return { error: "Informe seu e-mail." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return { error: "Confira o e-mail: falta algo como nome@exemplo.com." };
  return { value: text };
}
