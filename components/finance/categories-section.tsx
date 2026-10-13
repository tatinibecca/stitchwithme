import { ChartNoAxesColumn } from "lucide-react";
import { Money } from "@/components/money";
import { formatBRL } from "@/lib/format";
import type { CategoryTotal } from "@/lib/finance/month-overview";
import { SectionHeading } from "./section-heading";

export function CategoriesSection({
  categories,
  total,
  monthLabel,
}: {
  categories: CategoryTotal[];
  total: number;
  monthLabel: string;
}) {
  const max = categories[0]?.amount ?? 0;
  return (
    <section aria-labelledby="categorias-titulo" className="flex flex-col gap-3">
      <SectionHeading
        id="categorias-titulo"
        title="Gastos por categoria"
        description={categories.length ? `Contas e faturas de ${monthLabel} · total ${formatBRL(total)}` : undefined}
      />
      {categories.length === 0 ? (
        <div className="flex items-start gap-3 rounded-md border border-dashed border-input p-4">
          <ChartNoAxesColumn className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-body text-muted-foreground">
            As barras por categoria aparecem depois da primeira conta ou fatura do mês.
          </p>
        </div>
      ) : (
        // As barras são decorativas: o valor e o percentual de cada categoria estão no texto.
        <ul role="list" className="flex flex-col gap-3.5 rounded-md border bg-card p-4 md:p-5">
          {categories.map((c) => (
            <li key={c.categoryId} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-body">
                <span className="min-w-0">{c.name}</span>
                <span className="tabular shrink-0">
                  <Money cents={c.amount} />{" "}
                  <span className="text-muted-foreground">· {Math.round(c.share * 100)}%</span>
                </span>
              </div>
              <div aria-hidden="true" className="h-2 overflow-hidden rounded-pill bg-border">
                <div className="h-full rounded-pill bg-primary" style={{ width: `${(c.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
