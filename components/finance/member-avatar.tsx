import type { Member } from "@/lib/finance/types";
import { cn } from "@/lib/utils";

const SIZES = { sm: "size-6 text-[0.6875rem]", md: "size-10 text-body-large" } as const;

/**
 * Avatar com inicial. Os dois membros se diferenciam por forma (cheio × contorno),
 * não só por cor, e o nome aparece sempre ao lado.
 */
export function MemberAvatar({
  member,
  index,
  size = "sm",
  className,
}: {
  member: Pick<Member, "display_name">;
  /** Posição do membro na casa: 0 = cheio, 1 = contorno */
  index: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill font-bold",
        SIZES[size],
        index === 0 ? "bg-foreground text-background" : "border-[1.5px] border-foreground bg-background text-foreground",
        className,
      )}
    >
      {member.display_name.charAt(0).toUpperCase()}
    </span>
  );
}

export function MemberChip({ member, index }: { member: Pick<Member, "display_name">; index: number }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-body">
      <MemberAvatar member={member} index={index} />
      <span className="truncate">{member.display_name}</span>
    </span>
  );
}
