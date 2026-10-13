import type { LucideIcon } from "lucide-react";
import { CircleAlert, Inbox } from "lucide-react";
import { Mascot, type MascotPose } from "@/components/brand/mascot";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Estado vazio: explica o que vai aparecer aqui e qual é o próximo passo.
 * `mascot` troca o ícone pelo mascote (decorativo). Use com parcimônia:
 * boas-vindas → "acenando", nada pendente → "feliz", tudo pago → "celebrando".
 */
export function EmptyState({
  icon: Icon = Inbox,
  mascot,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  mascot?: MascotPose;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-dashed border-input bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {mascot ? (
        <Mascot pose={mascot} size={112} />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-pill bg-accent-soft text-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="text-subtitle">{title}</h2>
        <p className="text-body text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Estado de erro: anunciado ao leitor de tela e sempre com uma saída. Sem mascote: clareza antes de fofura. */
export function ErrorState({
  title = "Não foi possível carregar",
  description,
  action,
  live = true,
  className,
}: {
  title?: string;
  /** false para exemplos estáticos que não devem ser anunciados ao carregar */
  live?: boolean;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={live ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-destructive bg-status-overdue-bg px-6 py-12 text-center",
        className,
      )}
    >
      <CircleAlert className="size-8 text-status-overdue-fg" aria-hidden="true" />
      <div className="flex max-w-sm flex-col gap-1">
        <h2 className="text-subtitle text-status-overdue-fg">{title}</h2>
        <p className="text-body text-status-overdue-fg">{description}</p>
      </div>
      {action}
    </div>
  );
}

/** Estado de carregamento de lista: esqueleto com rótulo para leitor de tela. */
export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div role="status" aria-label="Carregando" className={cn("flex flex-col", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b py-4 last:border-b-0">
          <Skeleton className="size-10" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
