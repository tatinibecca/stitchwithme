"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Archive, CircleCheck, Pencil, Plus, RotateCcw } from "lucide-react";
import { setBillActive, unmarkBillPaid } from "@/app/actions/bills";
import { FormError } from "@/components/auth/auth-card";
import { BillsGroups } from "@/components/finance/bills-section";
import { MemberChip } from "@/components/finance/member-avatar";
import { MonthHeader } from "@/components/finance/month-header";
import { SectionHeading } from "@/components/finance/section-heading";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { describeRecurrence } from "@/lib/bills/recurrence";
import { buildMonthOverview, monthOf, type MonthItem } from "@/lib/finance/month-overview";
import type { FinanceData, ISODate, YearMonth } from "@/lib/finance/types";
import { formatBRL, formatMonthYear } from "@/lib/format";
import { PayDialog, type PayTarget } from "./pay-dialog";
import { usePayFlow } from "./use-pay-flow";

export function BillsMonth({
  data,
  month,
  today,
  live,
  savedName,
}: {
  data: FinanceData;
  month: YearMonth;
  today: ISODate;
  live: boolean;
  savedName?: string;
}) {
  const flow = usePayFlow();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  // Só contas fixas nesta tela.
  const billsOnly: FinanceData = useMemo(
    () => ({ ...data, statements: [], subscriptions: [], subscription_charges: [], transactions: [] }),
    [data],
  );
  const overview = useMemo(() => buildMonthOverview(billsOnly, month, today), [billsOnly, month, today]);
  const monthLabel = formatMonthYear(month);
  const active = data.bills.filter((b) => b.active);
  const archived = data.bills.filter((b) => !b.active);
  const memberIndex = (id: string) => Math.max(0, data.members.findIndex((m) => m.id === id));
  const categoryName = (id: string | null) => data.categories.find((c) => c.id === id)?.name ?? "Sem categoria";

  const toTarget = (item: MonthItem): PayTarget => ({
    occurrenceId: item.sourceId,
    name: item.name,
    expectedAmount: item.amount,
    isEstimated: item.isEstimated,
    dueDate: item.dueDate,
  });

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setActionError(result.message ?? null);
    });
  }

  const billIdOf = (item: MonthItem) => data.bill_occurrences.find((o) => o.id === item.sourceId)?.bill_id;

  return (
    <div className="flex flex-col gap-8">
      <MonthHeader month={month} currentMonth={monthOf(today)} showNewBill={live || data.bills.length > 0} eyebrow="Contas fixas" basePath="/financas/contas" />

      <div aria-live="polite" aria-atomic="true" className="empty:hidden">
        {savedName && !flow.lastPaid && (
          <p className="flex items-center gap-2 rounded-sm bg-status-paid-bg px-4 py-3 text-body font-semibold text-status-paid-fg">
            <CircleCheck className="size-4.5 shrink-0" aria-hidden="true" />
            {savedName === "1" ? "Alterações salvas." : `${savedName} cadastrada. Ela já aparece nos próximos vencimentos.`}
          </p>
        )}
        {flow.lastPaid && (
          <div className="flex items-center gap-2 rounded-sm bg-status-paid-bg py-0.5 pr-1 pl-4 text-body text-status-paid-fg">
            <CircleCheck className="size-4.5 shrink-0" aria-hidden="true" />
            <span className="flex-1">Pagamento de {flow.lastPaid.name} registrado.</span>
            <button type="button" onClick={flow.undo} disabled={flow.undoing} className="min-h-11 cursor-pointer rounded-sm px-3 font-semibold underline underline-offset-4">
              Desfazer
            </button>
          </div>
        )}
      </div>
      {(actionError || flow.undoError) && <FormError id="erro-contas" message={(actionError ?? flow.undoError)!} />}
      {!live && (
        <p role="note" className="rounded-sm bg-status-info-bg px-4 py-3 text-body text-status-info-fg">
          Modo demonstração: dados fictícios. Com o login configurado, aqui você cadastra e paga as contas de verdade.
        </p>
      )}

      {data.bills.length === 0 ? (
        <EmptyState
          mascot="acenando"
          title="Nenhuma conta fixa ainda"
          description="Cadastre aluguel, condomínio, luz e as outras contas da casa. Elas aparecem aqui todo mês, com o vencimento e o responsável."
          action={
            <Button asChild>
              <Link href="/financas/contas/nova">
                <Plus /> Cadastrar primeira conta
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <section aria-labelledby="mes-titulo" className="flex flex-col gap-3 rounded-lg border bg-card px-4 pt-5 pb-2 shadow-elevation-1 md:px-6">
            <SectionHeading
              id="mes-titulo"
              title={`Contas de ${monthLabel.split(" ")[0].toLowerCase()}`}
              description={
                overview.itemCount
                  ? `A pagar ${formatBRL(overview.totals.due + overview.totals.overdue)} · pago ${formatBRL(overview.totals.paid)}`
                  : undefined
              }
            />
            {overview.isMonthEmpty ? (
              <p className="pb-4 text-body-large text-muted-foreground">Nenhuma conta vence em {monthLabel.toLowerCase()}.</p>
            ) : (
              <BillsGroups
                overdue={overview.overdue}
                upcoming={overview.upcoming}
                settled={overview.settled}
                members={data.members}
                upcomingTitle="A pagar"
                settledTitle="Pagas"
                onPay={(item) => (live ? flow.open(toTarget(item)) : setActionError("No modo demonstração nada é salvo. Configure o login para usar de verdade."))}
                onUnpay={live ? (item) => run(() => unmarkBillPaid(item.sourceId)) : undefined}
                editHref={live ? (item) => { const id = billIdOf(item); return id ? `/financas/contas/${id}/editar?mes=${month}` : null; } : undefined}
              />
            )}
          </section>

          <section aria-labelledby="todas-titulo" className="flex flex-col gap-3">
            <SectionHeading id="todas-titulo" title="Todas as contas fixas" description={`${active.length} ${active.length === 1 ? "ativa" : "ativas"}`} />
            <ul role="list" className="flex flex-col rounded-lg border bg-card px-4 md:px-6">
              {active.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t py-4 first:border-t-0">
                  <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
                    <span className="font-semibold">{b.name}</span>
                    <span className="text-body text-muted-foreground">
                      {describeRecurrence({ due_day: b.due_day, recurrence_rule: b.recurrence_rule, due_month: b.due_month ?? null })} · {categoryName(b.category_id)}
                    </span>
                  </div>
                  <MemberChip member={data.members[memberIndex(b.owner_member_id)] ?? { display_name: "?" }} index={memberIndex(b.owner_member_id)} />
                  <span className="w-32 text-right">
                    <Money cents={b.amount} />
                    {b.is_estimated && <span className="block text-body-small text-muted-foreground">estimado</span>}
                  </span>
                  {live && (
                    <div className="flex items-center gap-1">
                      {confirmArchive === b.id ? (
                        <>
                          <Button type="button" variant="secondary" className="min-h-11 px-3 text-body" disabled={busy} onClick={() => { setConfirmArchive(null); run(() => setBillActive(b.id, false)); }}>
                            Arquivar {b.name}
                          </Button>
                          <Button type="button" variant="ghost" className="min-h-11 px-3 text-body" onClick={() => setConfirmArchive(null)}>
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href={`/financas/contas/${b.id}/editar?mes=${month}`} aria-label={`Editar ${b.name}`} className="inline-flex size-11 items-center justify-center rounded-pill text-muted-foreground hover:bg-surface hover:text-foreground">
                            <Pencil className="size-5" aria-hidden="true" />
                          </Link>
                          <button type="button" aria-label={`Arquivar ${b.name}`} onClick={() => setConfirmArchive(b.id)} className="inline-flex size-11 cursor-pointer items-center justify-center rounded-pill text-muted-foreground hover:bg-surface hover:text-foreground">
                            <Archive className="size-5" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {archived.length > 0 && (
              <details className="rounded-lg border bg-card px-4 py-3 md:px-6">
                <summary className="flex min-h-11 cursor-pointer items-center font-semibold">Arquivadas · {archived.length}</summary>
                <p className="pb-2 text-body text-muted-foreground">Contas arquivadas não geram novos vencimentos. O histórico continua salvo.</p>
                <ul role="list">
                  {archived.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 border-t py-3">
                      <span className="text-muted-foreground">{b.name}</span>
                      <Button type="button" variant="ghost" className="min-h-11 px-3 text-body" disabled={busy} onClick={() => run(() => setBillActive(b.id, true))}>
                        <RotateCcw /> Reativar
                      </Button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </>
      )}

      <PayDialog target={flow.target} today={today} onClose={flow.close} onPaid={flow.paid} />
    </div>
  );
}
