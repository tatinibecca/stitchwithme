import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/format";
import { shiftMonth } from "@/lib/finance/month-overview";
import type { YearMonth } from "@/lib/finance/types";

export function MonthHeader({
  month,
  currentMonth,
  showNewBill,
  eyebrow = "Visão do mês",
  basePath = "/financas",
}: {
  month: YearMonth;
  currentMonth: YearMonth;
  showNewBill: boolean;
  eyebrow?: string;
  basePath?: string;
}) {
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const navClass =
    "inline-flex size-11 items-center justify-center rounded-pill border border-input transition-colors duration-150 hover:bg-surface";

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="label-caps text-muted-foreground">{eyebrow}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-[1.75rem] leading-[2.125rem] font-extrabold md:text-section-title md:font-extrabold">
            {formatMonthYear(month)}
          </h1>
          <nav aria-label="Trocar de mês" className="flex items-center gap-1">
            <Link href={`${basePath}?mes=${prev}`} className={navClass} aria-label={`Mês anterior: ${formatMonthYear(prev)}`}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Link>
            <Link href={`${basePath}?mes=${next}`} className={navClass} aria-label={`Próximo mês: ${formatMonthYear(next)}`}>
              <ChevronRight className="size-5" aria-hidden="true" />
            </Link>
            {month !== currentMonth && (
              <Link
                href={basePath}
                className="inline-flex min-h-11 items-center px-2 text-body font-semibold underline underline-offset-4"
              >
                Voltar para {formatMonthYear(currentMonth).split(" ")[0].toLowerCase()}
              </Link>
            )}
          </nav>
        </div>
      </div>
      {showNewBill && (
        <Button asChild className={basePath === "/financas" ? "hidden lg:inline-flex" : undefined}>
          <Link href="/financas/contas/nova">
            <Plus /> Nova conta
          </Link>
        </Button>
      )}
    </header>
  );
}
