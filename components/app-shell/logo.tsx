import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logotipo provisório. Logotipos são isentos do requisito de contraste (WCAG 1.4.3). */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/financas"
      className={cn("inline-flex min-h-11 items-center rounded-xs font-display text-subtitle font-extrabold text-primary", className)}
    >
      Stitchwithme
    </Link>
  );
}
