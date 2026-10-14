"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { markBillPaid } from "@/app/actions/bills";
import { FormError } from "@/components/auth/auth-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { centsToInput } from "@/lib/bills/money";
import { formatBRL, formatDueDate } from "@/lib/format";

export interface PayTarget {
  occurrenceId: string;
  name: string;
  expectedAmount: number;
  isEstimated: boolean;
  dueDate: string;
}

/**
 * "Marcar como paga" (PRD §5.3): valor e data preenchidos com o previsto e hoje.
 * Conta estimada pede o valor real: o campo vem vazio, com o previsto como dica.
 */
export function PayDialog({
  target,
  today,
  onClose,
  onPaid,
}: {
  target: PayTarget | null;
  today: string;
  onClose: () => void;
  onPaid: (target: PayTarget) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && <PayForm key={target.occurrenceId} target={target} today={today} onPaid={onPaid} />}
    </Dialog>
  );
}

function PayForm({ target, today, onPaid }: { target: PayTarget; today: string; onPaid: (t: PayTarget) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await markBillPaid({
        occurrenceId: target.occurrenceId,
        amount: String(formData.get("amount") ?? ""),
        paidOn: String(formData.get("paid_on") ?? ""),
      });
      if (result.ok) onPaid(target);
      else setError(result.message);
    });
  }

  return (
    <DialogContent aria-describedby="pagar-descricao">
      <DialogTitle>Marcar {target.name} como paga</DialogTitle>
      <DialogDescription id="pagar-descricao">
        Vence em {formatDueDate(target.dueDate)} · previsto {formatBRL(target.expectedAmount)}
        {target.isEstimated ? " (estimado)" : ""}
      </DialogDescription>
      <form action={submit} className="flex flex-col gap-4" noValidate>
        {error && <FormError id="erro-pagamento" message={error} />}
        <TextField
          label={target.isEstimated ? "Valor real pago (R$)" : "Valor pago (R$)"}
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          required
          autoFocus
          defaultValue={target.isEstimated ? "" : centsToInput(target.expectedAmount)}
          placeholder={centsToInput(target.expectedAmount)}
          hint={target.isEstimated ? "Esta conta tem valor estimado. Confira na fatura o valor que foi pago." : undefined}
          className="tabular"
        />
        <TextField label="Data do pagamento" name="paid_on" type="date" required defaultValue={today} max={today} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={pending}>
            <Check /> {pending ? "Salvando…" : "Confirmar pagamento"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
