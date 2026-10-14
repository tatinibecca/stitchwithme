import { validateName } from "@/lib/auth/errors";
import { parseBRLToCents } from "./money";

export const PAYMENT_METHODS = [
  { value: "boleto", label: "Boleto" },
  { value: "debito_automatico", label: "Débito automático" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
] as const;

/** Sugestões do cadastro (PRD §5.1): nome e categoria padrão. */
export const BILL_SUGGESTIONS: { name: string; category: string; estimated?: boolean; yearly?: boolean }[] = [
  { name: "Aluguel", category: "Moradia" },
  { name: "Condomínio", category: "Moradia" },
  { name: "Luz", category: "Moradia", estimated: true },
  { name: "Água", category: "Moradia", estimated: true },
  { name: "Internet", category: "Moradia" },
  { name: "Gás", category: "Moradia", estimated: true },
  { name: "Celular", category: "Outros" },
  { name: "Seguro do carro", category: "Transporte/Carro" },
  { name: "IPVA", category: "Transporte/Carro", yearly: true },
];

export interface ParsedBill {
  name: string;
  category_id: string | null;
  owner_member_id: string;
  amount: number;
  is_estimated: boolean;
  due_day: number;
  recurrence_rule: "monthly" | "yearly";
  due_month: number | null;
  payment_method: string | null;
  notes: string | null;
}

/** Valida o formulário de conta (cadastro e "esta e as próximas"). */
export function parseBillForm(formData: FormData): { bill: ParsedBill } | { fieldErrors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = validateName(formData.get("name"), "o nome da conta", 60);
  if ("error" in name) errors.name = name.error;

  const amount = parseBRLToCents(String(formData.get("amount") ?? ""));
  if (amount === null) errors.amount = "Informe o valor em reais, por exemplo 211,37.";

  const dueDay = Number(formData.get("due_day"));
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) errors.due_day = "Informe um dia entre 1 e 31.";

  const rule = formData.get("recurrence_rule") === "yearly" ? "yearly" : "monthly";
  const dueMonth = Number(formData.get("due_month"));
  if (rule === "yearly" && (!Number.isInteger(dueMonth) || dueMonth < 1 || dueMonth > 12)) {
    errors.due_month = "Escolha o mês em que a conta vence.";
  }

  const owner = String(formData.get("owner_member_id") ?? "");
  if (!owner) errors.owner_member_id = "Escolha quem é responsável pela conta.";

  const notes = String(formData.get("notes") ?? "").trim();
  if (notes.length > 280) errors.notes = "Use no máximo 280 caracteres.";

  const method = String(formData.get("payment_method") ?? "");
  const methods: string[] = PAYMENT_METHODS.map((m) => m.value);

  if (Object.keys(errors).length > 0 || "error" in name || amount === null) return { fieldErrors: errors };
  return {
    bill: {
      name: name.value,
      category_id: String(formData.get("category_id") ?? "") || null,
      owner_member_id: owner,
      amount,
      is_estimated: formData.get("is_estimated") === "on",
      due_day: dueDay,
      recurrence_rule: rule,
      due_month: rule === "yearly" ? dueMonth : null,
      payment_method: methods.includes(method) ? method : null,
      notes: notes || null,
    },
  };
}

