import Link from "next/link";
import { Repeat, X } from "lucide-react";

export function SuggestionsNotice({ count, onDismiss }: { count: number; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-sm bg-status-info-bg py-1 pr-1 pl-4 text-status-info-fg">
      <Repeat className="mr-1 size-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 py-2 text-body">
        <strong className="font-semibold">
          {count} {count === 1 ? "possível assinatura detectada" : "possíveis assinaturas detectadas"}
        </strong>
        <span className="hidden sm:inline"> nas faturas. Confirme para acompanhar as cobranças.</span>
      </p>
      <Link
        href="/financas/assinaturas"
        className="inline-flex min-h-11 shrink-0 items-center rounded-sm px-2 text-body font-semibold underline underline-offset-4 hover:bg-background/60"
      >
        Revisar
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dispensar aviso"
        className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors duration-150 hover:bg-background/60"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
