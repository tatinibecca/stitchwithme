import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Check, CircleCheck, Clock, CreditCard, Pencil, Receipt, Repeat, TriangleAlert, Undo2 } from "lucide-react";
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
const ROW_GRID = "md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_8rem_minmax(11rem,auto)] md:items-center md:gap-4";

interface RowActions {
  onPay: (item: MonthItem) => void;
  /** Desfazer o pagamento de uma conta já paga */
  onUnpay?: (item: MonthItem) => void;
  /** Link de edição (só contas fixas) */
  editHref?: (item: MonthItem) => string | null;
}

interface RowProps extends RowActions {
  item: MonthItem;
  members: Member[];
}

function ItemRow({ item, members, onPay, onUnpay, editHref }: RowProps) {
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

  const href = editHref?.(item) ?? null;
  const editLink = href ? (
    <Link
      href={href}
      aria-label={`Editar ${item.name}`}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill text-muted-foreground transition-colors duration-150 hover:bg-surface hover:text-foreground"
    >
      <Pencil className="size-5" aria-hidden="true" />
    </Link>
  ) : null;
  const unpayButton =
    onUnpay && item.status === "paid" && item.kind === "bill" ? (
      <Button type="button" variant="ghost" onClick={() => onUnpay(item)} className="min-h-11 px-3 text-body">
        <Undo2 /> Desfazer pagamento
      </Button>
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
        {(unpayButton || editLink) && (
          <div className="flex items-center justify-end gap-1 md:hidden">
            {unpayButton}
            {editLink}
          </div>
        )}
      </div>

      <Money cents={amount} className="hidden text-right whitespace-nowrap md:block" />
      <div className="hidden items-center justify-end gap-1 md:flex">
        {payButton("flex-1")}
        {unpayButton}
        {editLink}
      </div>

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
  ...actions
}: RowActions & {
  title: string;
  icon: LucideIcon;
  tone: string;
  items: MonthItem[];
  members: Member[];
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
          <ItemRow key={item.id} item={item} members={members} {...actions} />
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
  upcomingTitle = "Próximas",
  settledTitle = "Pagas ou já cobradas",
  ...actions
}: RowActions & {
  overdue: MonthItem[];
  upcoming: MonthItem[];
  settled: MonthItem[];
  members: Member[];
  upcomingTitle?: string;
  settledTitle?: string;
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
      <Group title="Atrasadas" icon={TriangleAlert} tone="text-status-overdue-fg" items={overdue} members={members} {...actions} />
      <Group title={upcomingTitle} icon={Clock} tone="text-muted-foreground" items={upcoming} members={members} {...actions} />
      <Group title={settledTitle} icon={CircleCheck} tone="text-status-paid-fg" items={settled} members={members} {...actions} />
    </div>
  );
}
