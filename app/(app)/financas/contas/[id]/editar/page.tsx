import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BillForm } from "@/components/bills/bill-form";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { isYearMonth, monthOf } from "@/lib/finance/month-overview";
import { getFinanceSnapshot } from "@/lib/finance/repository";

export const metadata: Metadata = { title: "Editar conta fixa" };

export default function EditBillPage({ params, searchParams }: PageProps<"/financas/contas/[id]/editar">) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Editar conta fixa" />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-lg" />}>
        <EditBillContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function EditBillContent({ params, searchParams }: Pick<PageProps<"/financas/contas/[id]/editar">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requested = isYearMonth(query.mes) ? query.mes : undefined;
  const snapshot = await getFinanceSnapshot({ month: requested });
  const month = requested ?? monthOf(snapshot.today);
  const bill = snapshot.data.bills.find((b) => b.id === id);
  if (!bill) notFound();
  const occurrence = snapshot.data.bill_occurrences.find((o) => o.bill_id === id) ?? null;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-elevation-1 md:p-8">
      <h2 className="mb-6 text-subtitle font-bold">{bill.name}</h2>
      <BillForm
        members={snapshot.data.members}
        categories={snapshot.data.categories}
        currentMemberId={snapshot.currentMemberId}
        bill={bill}
        month={month}
        occurrence={occurrence}
      />
    </div>
  );
}
