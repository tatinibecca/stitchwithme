import { Money } from "@/components/money";
import { formatBRL } from "@/lib/format";
import type { OwnerTotals } from "@/lib/finance/month-overview";
import { MemberAvatar } from "./member-avatar";
import { SectionHeading } from "./section-heading";

export function OwnersSection({ owners }: { owners: OwnerTotals[] }) {
  const hasOnCard = owners.some((o) => o.subscriptionsOnCard > 0);
  return (
    <section aria-labelledby="responsaveis-titulo" className="flex flex-col gap-3">
      <SectionHeading
        id="responsaveis-titulo"
        title="Por responsável"
        description="Só para visibilidade: cada conta tem um dono."
      />
      <ul role="list" className="flex flex-col gap-3">
        {owners.map((o, index) => {
          const percent = o.total ? Math.round((o.paid / o.total) * 100) : 0;
          return (
            <li key={o.member.id} className="flex flex-col gap-3 rounded-md border bg-card p-4 md:p-5">
              <div className="flex items-center gap-3">
                <MemberAvatar member={o.member} index={index} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans text-body-large font-semibold">{o.member.display_name}</h3>
                  <p className="text-body text-muted-foreground">
                    {o.total
                      ? `Pago ${formatBRL(o.paid)} · falta ${formatBRL(o.total - o.paid)}`
                      : "Nenhuma conta neste mês"}
                  </p>
                </div>
                <Money cents={o.total} className="text-subtitle whitespace-nowrap" />
              </div>
              {o.total > 0 && (
                <>
                  <div aria-hidden="true" className="h-2 overflow-hidden rounded-pill bg-border">
                    <div
                      className="h-full rounded-pill bg-status-paid-fg"
                      style={{ width: `${o.paid ? Math.max(percent, 2) : 0}%` }}
                    />
                  </div>
                  <dl className="grid grid-cols-1 gap-1 text-body sm:grid-cols-3 sm:gap-3">
                    <div className="flex justify-between gap-3 sm:flex-col sm:justify-start sm:gap-0">
                      <dt className="text-muted-foreground">Contas fixas</dt>
                      <dd className="money font-semibold">{formatBRL(o.bills)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:flex-col sm:justify-start sm:gap-0">
                      <dt className="text-muted-foreground">Faturas</dt>
                      <dd className="money font-semibold">{formatBRL(o.statements)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 sm:flex-col sm:justify-start sm:gap-0">
                      <dt className="text-muted-foreground">Assinaturas*</dt>
                      <dd className="money font-semibold">{formatBRL(o.subscriptions + o.subscriptionsOnCard)}</dd>
                    </div>
                  </dl>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {hasOnCard && (
        <p className="text-body-small text-muted-foreground">
          * Assinaturas no cartão já estão dentro das faturas e não somam de novo no total.
        </p>
      )}
    </section>
  );
}
