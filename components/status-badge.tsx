import { CircleCheck, Clock, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type Status = "paid" | "due" | "overdue" | "info";

const STATUS: Record<Status, { label: string; icon: LucideIcon }> = {
  paid: { label: "Pago", icon: CircleCheck },
  due: { label: "A vencer", icon: Clock },
  overdue: { label: "Atrasado", icon: TriangleAlert },
  info: { label: "Info", icon: Info },
};

/** Status nunca depende só da cor: sempre cor + ícone + texto. */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  /** Substitui o texto padrão, ex.: "Atrasado há 3 dias" */
  label?: string;
  className?: string;
}) {
  const { label: defaultLabel, icon: Icon } = STATUS[status];
  return (
    <Badge variant={status} className={className}>
      <Icon aria-hidden="true" />
      {label ?? defaultLabel}
    </Badge>
  );
}
