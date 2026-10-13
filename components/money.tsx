import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Valor monetário a partir de centavos: DM Sans 700 + algarismos tabulares. */
export function Money({ cents, className }: { cents: number; className?: string }) {
  return <span className={cn("money", className)}>{formatBRL(cents)}</span>;
}
