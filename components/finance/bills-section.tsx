import type { LucideIcon } from "lucide-react";
import { Check, CircleCheck, Clock, CreditCard, Receipt, Repeat, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { describeItem } from "@/lib/finance/labels";
import type { ItemKind, MonthItem } from "@/lib/finance/month-overview";
import { effectiveAmount } from "@/lib/finance/month-overview";
import type { Member } from "@/lib/finance/types";
import { cn } from "@/lib/utils";
import { MemberChip } from "./member-avatar";

const KIND_ICON: Record<ItemKind, LucideIcon> = {
  bill: Receipt,
  statement: CreditCard,
  subscription: Repeat,
};

const KIND_LABEL: Record<ItemKind, string> = {
  bill: "Conta fixa",
  statement: "Fatura de cartão",
  subscription: "Assinatura",
};

/** Colunas no desktop: ícone · conta (com responsável) · valor · ação */
const ROW_GRID = "md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_8rem_11rem] md:items-center md:gap-4";

interface RowProps {
  item: MonthItem;
  members: Member[];
  onPay: (item: MonthItem) => void;
}

function ItemRow({ item, members, onPay }: RowProps) {
  const ownerIndex = Math.max(0, members.findIndex((m) => m.id === item.ownerMemberId));
  const owner = members[ownerIndex];
  const memberName = (id: string) => members.find((m) => m.id === id)?.display_name ?? "alguém";
  const { badge, meta } = describeItem(item, memberName);
  const Icon = item.status === "paid" ? Check : KIND_ICON[item.kind];
  const amount = effectiveAmount(item);

  const statusBadge =
    item.status === "overdue" ? (
      <StatusBadge status="overdue" label={badge} />
    ) : item.status === "due" ? (
      <StatusBadge status="due" label={badge} />
    ) : item.status === "paid" ? (
      <StatusBadge status="paid" label={badge} />
    ) : (
      <StatusBadge status="info" label={badge} icon={CreditCard} />
    );

  const payButton = (className: string, compact = false) =>
    item.payable && item.status !== "paid" ? (
      compact ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => onPay(item)}
          aria-label={`Marcar ${item.name} como pago`}
          className={cn("size-11 shrink-0 rounded-pill border-input", className)}
        >
          <Check />
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPay(item)}
          className={cn("min-h-11 px-3 text-body", item.status === "due" && "border-input", className)}
        >
          <Check /> Marcar como pago
        </Button>
      )
    ) : null;

  return (
    <li className={cn("flex gap-3 border-t py-4", ROW_GRID)}>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-sm",
          item.status === "overdue" && "bg-status-overdue-bg text-status-overdue-fg",
          item.status === "paid" && "bg-status-paid-bg text-status-paid-fg",
          (item.status === "due" || item.status === "on_card") && "bg-surface text-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
        <span className="sr-only">{KIND_LABEL[item.kind]}</span>
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 font-semibold break-words">{item.name}</span>
          <Money cents={amount} className="shrink-0 whitespace-nowrap md:hidden" />
        </div>
        <span className="text-body text-muted-foreground">{meta}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {statusBadge}
          <MemberChip member={owner} index={ownerIndex} />
        </div>
        {item.status === "overdue" && payButton("mt-1.5 w-full md:hidden")}
      </div>

      <Money cents={amount} className="hidden text-right whitespace-nowrap md:block" />
      <div className="hidden md:block">{payButton("w-full")}</div>

      {item.status === "due" && payButton("self-center md:hidden", true)}
    </li>
  );
}

function Group({
  title,
  icon: Icon,
  tone,
  items,
  members,
  onPay,
}: {
  title: string;
  icon: LucideIcon;
  tone: string;
  items: MonthItem[];
  members: Member[];
  onPay: (item: MonthItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={cn("label-caps flex items-center gap-2 pt-4 pb-1 font-sans", tone)}>
        <Icon className="size-4" aria-hidden="true" />
        {title} · {items.length}
      </h3>
      <ul role="list">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} members={members} onPay={onPay} />
        ))}
      </ul>
    </div>
  );
}

export function BillsGroups({
  overdue,
  upcoming,
  settled,
  members,
  onPay,
}: {
  overdue: MonthItem[];
  upcoming: MonthItem[];
  settled: MonthItem[];
  members: Member[];
  onPay: (item: MonthItem) => void;
}) {
  return (
    <div>
      <div
        aria-hidden="true"
        className={cn("label-caps hidden pt-2 text-muted-foreground", ROW_GRID)}
      >
        <span />
        <span>Conta e responsável</span>
        <span className="text-right">Valor</span>
        <span />
      </div>
      <Group title="Atrasadas" icon={TriangleAlert} tone="text-status-overdue-fg" items={overdue} members={members} onPay={onPay} />
      <Group title="Próximas" icon={Clock} tone="text-muted-foreground" items={upcoming} members={members} onPay={onPay} />
      <Group title="Pagas ou já cobradas" icon={CircleCheck} tone="text-status-paid-fg" items={settled} members={members} onPay={onPay} />
    </div>
  );
}
