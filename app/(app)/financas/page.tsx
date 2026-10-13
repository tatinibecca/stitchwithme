import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";

export const metadata: Metadata = { title: "Visão do mês" };

export default function MonthOverviewPage() {
  return (
    <>
      <PageHeader title="Visão do mês" description="Contas, faturas e assinaturas do mês num só lugar." />
      <EmptyState
        icon={CalendarDays}
        title="Seu mês ainda está vazio"
        description="Cadastre as contas fixas da casa para ver aqui o que vence, o que já foi pago e quem é responsável por cada conta."
        action={
          <Button asChild>
            <Link href="/financas/contas">Ir para Contas fixas</Link>
          </Button>
        }
      />
    </>
  );
}
