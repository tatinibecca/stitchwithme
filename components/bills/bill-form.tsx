"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { createBill, updateBill, type BillFormState } from "@/app/actions/bills";
import { FormError } from "@/components/auth/auth-card";
import { CheckboxField, RadioCards, SelectField, TextAreaField } from "@/components/form-fields";
import { MemberAvatar } from "@/components/finance/member-avatar";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { BILL_SUGGESTIONS, PAYMENT_METHODS } from "@/lib/bills/form";
import { centsToInput } from "@/lib/bills/money";
import { MONTH_NAMES } from "@/lib/bills/recurrence";
import { formatMonthYear } from "@/lib/format";
import type { Bill, BillOccurrence, Category, Member } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

interface Props {
  members: Member[];
  categories: Category[];
  currentMemberId: string;
  /** Edição: a conta, o mês aberto e a ocorrência desse mês (se houver) */
  bill?: Bill;
  month?: string;
  occurrence?: BillOccurrence | null;
}

export function BillForm({ members, categories, currentMemberId, bill, month, occurrence }: Props) {
  const editing = Boolean(bill);
  const [state, action, pending] = useActionState<BillFormState, FormData>(editing ? updateBill : createBill, {
    status: "idle",
  });
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const sent = state.status === "error" ? state.values : undefined;

  const canEditOnlyThis = Boolean(occurrence && occurrence.status === "pending");
  const [scope, setScope] = useState<"this" | "from">(canEditOnlyThis ? "this" : "from");
  const [name, setName] = useState(bill?.name ?? "");
  const [categoryId, setCategoryId] = useState(bill?.category_id ?? "");
  const [estimated, setEstimated] = useState(bill?.is_estimated ?? false);
  const [rule, setRule] = useState<"monthly" | "yearly">(bill?.recurrence_rule === "yearly" ? "yearly" : "monthly");
  const [owner, setOwner] = useState(bill?.owner_member_id ?? currentMemberId);

  function applySuggestion(s: (typeof BILL_SUGGESTIONS)[number]) {
    setName(s.name);
    setCategoryId(categories.find((c) => c.name === s.category)?.id ?? "");
    setEstimated(Boolean(s.estimated));
    setRule(s.yearly ? "yearly" : "monthly");
  }

  const monthLabel = month ? formatMonthYear(month).toLowerCase() : "";

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {state.status === "error" && <FormError id="erro-conta" message={state.message} />}

      {editing && (
        <>
          <input type="hidden" name="bill_id" value={bill!.id} />
          <input type="hidden" name="month" value={month} />
          {occurrence && <input type="hidden" name="occurrence_id" value={occurrence.id} />}
          <RadioCards<"this" | "from">
            legend="O que você quer mudar?"
            name="scope"
            value={scope}
            onChange={setScope}
            options={[
              ...(canEditOnlyThis
                ? [{ value: "this" as const, label: `Só a de ${monthLabel}`, description: "Valor e data deste mês. As outras não mudam." }]
                : []),
              { value: "from" as const, label: `De ${monthLabel} em diante`, description: "A conta toda. Meses passados e pagos ficam como estão." },
            ]}
          />
        </>
      )}

      {editing && scope === "this" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Valor previsto (R$)"
            name="amount"
            inputMode="decimal"
            required
            defaultValue={sent?.amount ?? centsToInput(occurrence!.expected_amount)}
            error={errors.amount}
            className="tabular"
          />
          <TextField
            label="Vencimento"
            name="due_date"
            type="date"
            required
            defaultValue={sent?.due_date ?? occurrence!.due_date}
            min={`${month}-01`}
            max={`${month}-31`}
            error={errors.due_date}
          />
        </div>
      ) : (
        <>
          {!editing && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-body font-semibold">Sugestões</legend>
              <div className="flex flex-wrap gap-2">
                {BILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    aria-pressed={name === s.name}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill border px-4 text-body font-semibold transition-colors duration-150",
                      name === s.name ? "border-primary bg-accent-soft text-foreground" : "border-input bg-card hover:bg-surface",
                    )}
                  >
                    {name === s.name && <Check className="size-4" aria-hidden="true" />}
                    {s.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <TextField
            label="Nome da conta"
            name="name"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Condomínio"
            error={errors.name}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Categoria" name="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <TextField
              label={estimated ? "Valor estimado (R$)" : "Valor (R$)"}
              name="amount"
              inputMode="decimal"
              required
              autoComplete="off"
              placeholder="Ex.: 211,37"
              defaultValue={sent?.amount ?? (bill ? centsToInput(bill.amount) : "")}
              error={errors.amount}
              className="tabular"
            />
          </div>

          <CheckboxField
            label="O valor muda todo mês"
            hint="Para luz, água e gás. Ao marcar como paga, o app pede o valor real."
            name="is_estimated"
            checked={estimated}
            onChange={(e) => setEstimated(e.target.checked)}
          />

          <RadioCards<"monthly" | "yearly">
            legend="Repete"
            name="recurrence_rule"
            value={rule}
            onChange={setRule}
            options={[
              { value: "monthly", label: "Todo mês" },
              { value: "yearly", label: "Uma vez por ano", description: "IPVA, seguro, anuidade…" },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Dia do vencimento"
              name="due_day"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              required
              defaultValue={sent?.due_day ?? bill?.due_day ?? ""}
              hint="Dia 29, 30 ou 31 vira o último dia nos meses mais curtos."
              error={errors.due_day}
            />
            {rule === "yearly" && (
              <SelectField label="Mês do vencimento" name="due_month" defaultValue={sent?.due_month ?? bill?.due_month ?? ""} error={errors.due_month}>
                <option value="">Escolha o mês</option>
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </SelectField>
            )}
          </div>

          <RadioCards<string>
            legend="Quem é responsável"
            name="owner_member_id"
            value={owner}
            onChange={setOwner}
            error={errors.owner_member_id}
            options={members.map((m, index) => ({
              value: m.id,
              label: (
                <span className="flex items-center gap-2">
                  <MemberAvatar member={m} index={index} />
                  {m.display_name}
                </span>
              ),
            }))}
          />

          <SelectField label="Forma de pagamento (opcional)" name="payment_method" defaultValue={sent?.payment_method ?? bill?.payment_method ?? ""}>
            <option value="">Não informar</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </SelectField>

          <TextAreaField label="Observação (opcional)" name="notes" maxLength={280} defaultValue={sent?.notes ?? bill?.notes ?? ""} />
        </>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={month ? `/financas/contas?mes=${month}` : "/financas/contas"}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          <Check /> {pending ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar conta"}
        </Button>
      </div>
    </form>
  );
}
