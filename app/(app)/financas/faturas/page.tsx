import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = { title: "Faturas" };

export default function Page() {
  return (
    <>
      <PageHeader title="Faturas" description="Faturas dos cartões importadas por CSV ou OFX." />
      <EmptyState
        icon={CreditCard}
        title="Nenhuma fatura importada"
        description="Depois de cadastrar um cartão, você importa a fatura do banco e as compras aparecem aqui já categorizadas."
      />
    </>
  );
}
