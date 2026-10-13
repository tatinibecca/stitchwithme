import type { Metadata } from "next";
import { Repeat } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = { title: "Assinaturas" };

export default function Page() {
  return (
    <>
      <PageHeader title="Assinaturas" description="Streaming, apps e serviços cobrados todo mês ou todo ano." />
      <EmptyState
        icon={Repeat}
        title="Nenhuma assinatura acompanhada"
        description="As assinaturas aparecem aqui com a próxima cobrança e o custo mensal. O app também vai sugerir assinaturas encontradas nas faturas."
      />
    </>
  );
}
