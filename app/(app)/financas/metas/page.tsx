import type { Metadata } from "next";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = { title: "Metas" };

export default function Page() {
  return (
    <>
      <PageHeader title="Metas" description="Os sonhos da casa e quanto falta para chegar lá." />
      <EmptyState
        icon={Target}
        title="Nenhuma meta criada"
        description="Crie uma meta, registre os aportes e acompanhe quanto falta por mês até a data que vocês definirem."
      />
    </>
  );
}
