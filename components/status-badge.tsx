import { CircleCheck, Clock, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type Status = "paid" | "due" | "overdue" | "info";

const STATUS: Record<Status, { label: string; icon: LucideIcon }> = {
  paid: { label: "Pago", icon: CircleCheck },
  due: { label: "A pagar", icon: Clock },
  overdue: { label: "Atrasado", icon: TriangleAlert },
  info: { label: "Info", icon: Info },
};

/** Status nunca depende só da cor: sempre cor + ícone + texto. */
export function StatusBadge({
  status,
  label,
  icon,
  className,
}: {
  status: Status;
  /** Substitui o texto padrão, ex.: "Atrasado há 3 dias" */
  label?: string;
  /** Substitui o ícone padrão, ex.: cartão para "No cartão Itaú" */
  icon?: LucideIcon;
  className?: string;
}) {
  const { label: defaultLabel, icon: defaultIcon } = STATUS[status];
  const Icon = icon ?? defaultIcon;
  return (
    <Badge variant={status} className={className}>
      <Icon aria-hidden="true" />
      {label ?? defaultLabel}
    </Badge>
  );
}
