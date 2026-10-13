import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = { title: "Contas fixas" };

export default function Page() {
  return (
    <>
      <PageHeader title="Contas fixas" description="Aluguel, luz, internet e outras contas que se repetem." />
      <EmptyState
        icon={Receipt}
        title="Nenhuma conta fixa cadastrada"
        description="As contas fixas aparecem aqui com vencimento, valor e responsável."
      />
    </>
  );
}
