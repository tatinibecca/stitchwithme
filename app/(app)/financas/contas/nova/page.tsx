import type { Metadata } from "next";
import { Suspense } from "react";
import { BillForm } from "@/components/bills/bill-form";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getFinanceSnapshot } from "@/lib/finance/repository";

export const metadata: Metadata = { title: "Nova conta fixa" };

export default function NewBillPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader title="Nova conta fixa" description="Ela aparece todo mês na lista, com o vencimento e quem é responsável." />
      <Suspense fallback={<Skeleton className="h-[40rem] rounded-lg" />}>
        <NewBillContent />
      </Suspense>
    </div>
  );
}

async function NewBillContent() {
  const snapshot = await getFinanceSnapshot();
  return (
    <div className="rounded-lg border bg-card p-5 shadow-elevation-1 md:p-8">
      {!snapshot.live && (
        <p role="note" className="mb-6 rounded-sm bg-status-info-bg px-4 py-3 text-body text-status-info-fg">
          Modo demonstração: o formulário funciona, mas nada é salvo.
        </p>
      )}
      <BillForm members={snapshot.data.members} categories={snapshot.data.categories} currentMemberId={snapshot.currentMemberId} />
    </div>
  );
}
