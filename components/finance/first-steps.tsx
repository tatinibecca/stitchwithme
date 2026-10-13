import Link from "next/link";
import { Check, CreditCard, Plus } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/button";

/** Estado vazio do primeiro acesso: o que aparece aqui e o próximo passo. */
export function FirstSteps({ partnerName }: { partnerName: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-start md:gap-5 md:text-left">
        <Mascot pose="acenando" size={96} className="shrink-0" />
        <div className="flex flex-col gap-1">
          <h3 className="text-subtitle font-bold">Boas-vindas à Casita!</h3>
          <p className="max-w-xl text-body text-muted-foreground md:text-body-large">
            Nenhuma conta neste mês ainda. Cadastre as contas fixas da casa: elas aparecem aqui em ordem de vencimento, com o responsável de cada uma.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="label-caps text-muted-foreground">Primeiros passos · {partnerName ? "1" : "0"} de 3</p>
        <ol className="grid gap-3 md:grid-cols-3">
          <li className="flex gap-3 rounded-lg bg-status-paid-bg p-4 text-status-paid-fg md:flex-col md:p-5">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-status-paid-fg text-status-paid-bg">
              <Check className="size-4" strokeWidth={2.5} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Criar a casa e convidar {partnerName ?? "seu par"}</span>
              <span className="text-body">{partnerName ? `Concluído · ${partnerName} já entrou` : "Pendente"}</span>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border-2 border-primary p-4 md:flex-col md:p-5">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-pill border-2 border-foreground text-body font-bold">
              2
            </span>
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Cadastrar as contas fixas</span>
                <span className="text-body text-muted-foreground">Aluguel, condomínio, luz, água, internet… Leva uns 5 minutos.</span>
              </div>
              <Button asChild className="self-start">
                <Link href="/financas/contas">
                  <Plus /> Cadastrar contas
                </Link>
              </Button>
            </div>
          </li>
          <li className="flex gap-3 rounded-lg border bg-card p-4 md:flex-col md:p-5">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-input text-body font-bold text-muted-foreground">
              3
            </span>
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Cadastrar um cartão e importar a fatura</span>
                <span className="text-body text-muted-foreground">Arquivo CSV ou OFX do banco. O app sugere as categorias.</span>
              </div>
              <Button asChild variant="secondary" className="min-h-11 self-start px-4">
                <Link href="/financas/faturas">
                  <CreditCard /> Adicionar cartão
                </Link>
              </Button>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
