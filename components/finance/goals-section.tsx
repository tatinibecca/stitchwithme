import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { formatBRL, formatShortMonthYear } from "@/lib/format";
import type { GoalProgress } from "@/lib/finance/month-overview";
import { SectionHeading } from "./section-heading";

function pace(goal: GoalProgress) {
  if (goal.status === "completed") return "Meta concluída";
  if (goal.monthlyNeeded && goal.targetDate) {
    return `Faltam ${formatBRL(goal.remaining)}, ou ${formatBRL(goal.monthlyNeeded)}/mês até ${formatShortMonthYear(goal.targetDate)}`;
  }
  return `Faltam ${formatBRL(goal.remaining)} · sem data-alvo`;
}

export function GoalsSection({ goals }: { goals: GoalProgress[] }) {
  return (
    <section aria-labelledby="metas-titulo" className="flex flex-col gap-3">
      <SectionHeading
        id="metas-titulo"
        title="Metas"
        description={goals.length > 0 ? "Progresso e quanto guardar por mês." : undefined}
        action={
          goals.length > 0 && (
            <Link
              href="/financas/metas"
              className="inline-flex min-h-11 items-center px-1 text-body font-semibold underline underline-offset-4"
            >
              Ver todas
            </Link>
          )
        }
      />
      {goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-input px-4 py-6 text-center md:flex-row md:text-left">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-surface">
            <Target className="size-6" aria-hidden="true" />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="text-subtitle font-bold">Qual é o próximo sonho?</h3>
            <p className="text-body text-muted-foreground">
              Lua de mel, reserva, um sofá novo. Crie uma meta e veja quanto guardar por mês.
            </p>
          </div>
          <Button asChild variant="secondary" className="min-h-11 px-4">
            <Link href="/financas/metas">
              <Plus /> Criar meta
            </Link>
          </Button>
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {goals.map((g) => (
            <li key={g.id} className="flex flex-col gap-2.5 rounded-md border bg-card p-4 shadow-elevation-1 md:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 items-baseline gap-3">
                  <h3 className="text-subtitle font-bold">{g.name}</h3>
                  <span className="text-body-small text-muted-foreground">
                    {g.owner ? g.owner.display_name : "Conjunta"}
                  </span>
                </div>
                <span className="tabular text-body">
                  <Money cents={g.current} className="text-body-large" />{" "}
                  <span className="text-muted-foreground">de {formatBRL(g.target)}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  role="progressbar"
                  aria-label={`Progresso de ${g.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={g.percent}
                  aria-valuetext={`${g.percent}%`}
                  className="h-2.5 flex-1 overflow-hidden rounded-pill bg-border"
                >
                  <div className="h-full rounded-pill bg-primary" style={{ width: `${g.percent}%` }} />
                </div>
                <span className="money w-10 text-right text-body">{g.percent}%</span>
              </div>
              <p className="text-body text-muted-foreground">{pace(g)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
