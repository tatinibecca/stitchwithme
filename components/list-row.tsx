import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function List({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul role="list" className={cn("flex flex-col", className)} {...props} />;
}

/**
 * Linha de lista: ícone, título, descrição e, à direita, valor + status.
 * No app de finanças o "thumbnail" do design system vira um ícone de categoria.
 */
export function ListRow({
  icon: Icon,
  title,
  description,
  trailing,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <li className={cn("flex min-h-touch items-center gap-4 border-b py-4 last:border-b-0", className)}>
      {Icon && (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-surface text-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-display text-body-large font-semibold">{title}</span>
        {description && <span className="text-body text-muted-foreground">{description}</span>}
      </div>
      {trailing && <div className="flex shrink-0 flex-col items-end gap-1 text-right">{trailing}</div>}
    </li>
  );
}
