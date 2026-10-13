import type { LucideIcon } from "lucide-react";
import { CircleCheck, Clock, Repeat, TriangleAlert } from "lucide-react";
import { Money } from "@/components/money";
import type { MonthOverview } from "@/lib/finance/month-overview";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function Tile({
  label,
  icon: Icon,
  cents,
  note,
  suffix,
  className,
}: {
  label: string;
  icon: LucideIcon;
  cents: number;
  note: string;
  suffix?: string;
  className: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 rounded-md p-4", className)}>
      <dt className="label-caps flex items-center gap-1.5">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-subtitle">
        <Money cents={cents} className="text-[1.25rem] leading-7" />
        {suffix && <span className="text-body font-medium opacity-80">{suffix}</span>}
      </dd>
      <dd className="text-body-small">{note}</dd>
    </div>
  );
}

export function SummarySection({ totals, muted = false }: { totals: MonthOverview["totals"]; muted?: boolean }) {
  const neutral = "border bg-card text-foreground [&_dt]:text-muted-foreground";
  return (
    <section aria-labelledby="resumo-titulo" className="flex flex-col gap-3">
      <SectionHeading id="resumo-titulo" title="Resumo do mês" />
      <dl className="grid grid-cols-2 gap-3">
        <Tile
          label="Atrasado"
          icon={TriangleAlert}
          cents={totals.overdue}
          note={totals.overdueCount ? plural(totals.overdueCount, "conta", "contas") : "Nada atrasado"}
          className={muted || !totals.overdueCount ? neutral : "bg-status-overdue-bg text-status-overdue-fg"}
        />
        <Tile
          label="A vencer"
          icon={Clock}
          cents={totals.due}
          note={plural(totals.dueCount, "conta ou fatura", "contas e faturas")}
          className={muted ? neutral : "bg-status-due-bg text-status-due-fg"}
        />
        <Tile
          label="Pago"
          icon={CircleCheck}
          cents={totals.paid}
          note={plural(totals.paidCount, "pagamento", "pagamentos")}
          className={muted ? neutral : "bg-status-paid-bg text-status-paid-fg"}
        />
        <Tile
          label="Assinaturas"
          icon={Repeat}
          cents={totals.subscriptionsMonthly}
          suffix="/mês"
          note={
            totals.activeSubscriptions
              ? `${plural(totals.activeSubscriptions, "ativa", "ativas")}${totals.trialSubscriptions ? ` · ${totals.trialSubscriptions} em teste` : ""}`
              : "Nenhuma assinatura"
          }
          className={cn(neutral, "[&_dd:last-child]:text-muted-foreground")}
        />
      </dl>
      {muted && (
        <p className="text-body text-muted-foreground">
          Os totais se preenchem conforme vocês cadastram contas e importam faturas.
        </p>
      )}
    </section>
  );
}
