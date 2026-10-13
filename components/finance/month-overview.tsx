"use client";

import { useMemo, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { formatBRL } from "@/lib/format";
import { formatMonthYear } from "@/lib/format";
import {
  buildMonthOverview,
  monthOf,
  type MonthItem,
  type PaidOverrides,
} from "@/lib/finance/month-overview";
import type { FinanceData, Id, ISODate, YearMonth } from "@/lib/finance/types";
import { BillsGroups } from "./bills-section";
import { CategoriesSection } from "./categories-section";
import { FirstSteps } from "./first-steps";
import { GoalsSection } from "./goals-section";
import { MonthHeader } from "./month-header";
import { OwnersSection } from "./owners-section";
import { SectionHeading } from "./section-heading";
import { SuggestionsNotice } from "./suggestions-notice";
import { SummarySection } from "./summary-section";

/**
 * Home do módulo Finanças. Antes do banco, "Marcar como pago" vive só nesta
 * sessão (overrides em memória); com o Supabase, vira uma mutação.
 */
export function MonthOverview({
  data,
  month,
  today,
  currentMemberId,
}: {
  data: FinanceData;
  month: YearMonth;
  today: ISODate;
  currentMemberId: Id;
}) {
  const [overrides, setOverrides] = useState<PaidOverrides>({});
  const [lastPaid, setLastPaid] = useState<MonthItem | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const overview = useMemo(() => buildMonthOverview(data, month, today, overrides), [data, month, today, overrides]);
  const monthLabel = formatMonthYear(month);
  const allPaid =
    !overview.isMonthEmpty && overview.totals.overdueCount === 0 && overview.totals.dueCount === 0 && overview.totals.paidCount > 0;
  const partner = data.members.find((m) => m.id !== currentMemberId) ?? null;

  function markAsPaid(item: MonthItem) {
    setOverrides((prev) => ({
      ...prev,
      [item.id]: { paid_at: today, paid_by_member_id: currentMemberId, paid_amount: item.amount },
    }));
    setLastPaid(item);
  }

  function undo() {
    if (!lastPaid) return;
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[lastPaid.id];
      return next;
    });
    setLastPaid(null);
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-6">
      <MonthHeader month={month} currentMonth={monthOf(today)} showNewBill={!overview.isFirstAccess} />

      {overview.suggestionsCount > 0 && !noticeDismissed && (
        <SuggestionsNotice count={overview.suggestionsCount} onDismiss={() => setNoticeDismissed(true)} />
      )}

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
        <section
          aria-labelledby="contas-titulo"
          className="flex min-w-0 flex-col gap-3 rounded-md border bg-card px-4 pt-5 pb-2 shadow-elevation-1 md:px-6 lg:col-span-8"
        >
          <SectionHeading
            id="contas-titulo"
            title="Contas e assinaturas"
            action={
              overview.itemCount > 0 && (
                <span className="shrink-0 text-body text-muted-foreground">
                  {overview.itemCount} {overview.itemCount === 1 ? "item" : "itens"}
                </span>
              )
            }
          />

          <div aria-live="polite" aria-atomic="true">
            {lastPaid && (
              <div className="flex items-center gap-2 rounded-sm bg-status-paid-bg py-0.5 pr-1 pl-3 text-body text-status-paid-fg">
                <CircleCheck className="size-4.5 shrink-0" aria-hidden="true" />
                <span className="flex-1">Pagamento de {lastPaid.name} registrado.</span>
                <button
                  type="button"
                  onClick={undo}
                  className="min-h-11 cursor-pointer rounded-sm px-3 font-semibold underline underline-offset-4 hover:bg-background/60"
                >
                  Desfazer
                </button>
              </div>
            )}
          </div>

          {overview.isFirstAccess ? (
            <div className="pb-4">
              <FirstSteps partnerName={partner?.display_name ?? null} />
            </div>
          ) : overview.isMonthEmpty ? (
            <div className="flex flex-col items-center gap-3 pb-6 text-center">
              <Mascot pose="feliz" size={96} />
              <p className="text-subtitle font-bold">Nada vencendo por aqui</p>
              <p className="text-body text-muted-foreground">
                Nenhuma conta, fatura ou assinatura em {monthLabel.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
            {allPaid && (
              <div className="mt-1 flex items-center gap-4 rounded-lg bg-accent p-4 text-accent-foreground">
                <Mascot pose="celebrando" size={72} className="shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-subtitle font-bold">Tudo pago em {monthLabel.split(" ")[0].toLowerCase()}!</p>
                  <p className="text-body">
                    {overview.totals.paidCount} {overview.totals.paidCount === 1 ? "conta quitada" : "contas quitadas"} ·{" "}
                    <span className="money">{formatBRL(overview.totals.paid)}</span>
                  </p>
                </div>
              </div>
            )}
            <BillsGroups
              overdue={overview.overdue}
              upcoming={overview.upcoming}
              settled={overview.settled}
              members={data.members}
              onPay={markAsPaid}
            />
            </>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-8 lg:col-span-4 lg:gap-6">
          <SummarySection totals={overview.totals} muted={overview.isMonthEmpty} />
          <CategoriesSection
            categories={overview.categories}
            total={overview.categoriesTotal}
            monthLabel={monthLabel.split(" ")[0].toLowerCase()}
          />
        </div>

        <div className="min-w-0 lg:col-span-5">
          <OwnersSection owners={overview.owners} />
        </div>
        <div className="min-w-0 lg:col-span-7">
          <GoalsSection goals={overview.goals} />
        </div>
      </div>
    </div>
  );
}
