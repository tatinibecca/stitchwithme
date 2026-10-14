import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeSkeleton } from "@/components/finance/home-skeleton";
import { MonthOverview } from "@/components/finance/month-overview";
import { isYearMonth, monthOf } from "@/lib/finance/month-overview";
import { getFinanceSnapshot } from "@/lib/finance/repository";

export const metadata: Metadata = { title: "Visão do mês" };

export default function MonthOverviewPage({ searchParams }: PageProps<"/financas">) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: Pick<PageProps<"/financas">, "searchParams">) {
  const params = await searchParams;
  // Protótipo sem banco: ?estado=vazio simula o primeiro acesso; ?estado=carregando mostra o esqueleto.
  if (params.estado === "carregando") return <HomeSkeleton />;

  const requested = isYearMonth(params.mes) ? params.mes : undefined;
  const snapshot = await getFinanceSnapshot({ simulateEmpty: params.estado === "vazio", month: requested });
  const month = requested ?? monthOf(snapshot.today);

  return (
    <MonthOverview
      data={snapshot.data}
      month={month}
      today={snapshot.today}
      currentMemberId={snapshot.currentMemberId}
      live={snapshot.live}
    />
  );
}
