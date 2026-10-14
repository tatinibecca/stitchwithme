import type { Metadata } from "next";
import { Suspense } from "react";
import { BillsMonth } from "@/components/bills/bills-month";
import { HomeSkeleton } from "@/components/finance/home-skeleton";
import { isYearMonth, monthOf } from "@/lib/finance/month-overview";
import { getFinanceSnapshot } from "@/lib/finance/repository";

export const metadata: Metadata = { title: "Contas fixas" };

export default function BillsPage({ searchParams }: PageProps<"/financas/contas">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <BillsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BillsContent({ searchParams }: Pick<PageProps<"/financas/contas">, "searchParams">) {
  const params = await searchParams;
  const requested = isYearMonth(params.mes) ? params.mes : undefined;
  const snapshot = await getFinanceSnapshot({ month: requested });
  const month = requested ?? monthOf(snapshot.today);
  return (
    <BillsMonth
      data={snapshot.data}
      month={month}
      today={snapshot.today}
      live={snapshot.live}
      savedName={typeof params.salvo === "string" ? params.salvo : undefined}
    />
  );
}
