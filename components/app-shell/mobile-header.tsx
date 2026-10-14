import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <Logo height={36} />
      <div className="flex items-center gap-1">
        <ThemeToggle variant="compact" />
        <Link
          href="/casa"
          aria-label="Nossa casa"
          className="inline-flex size-11 items-center justify-center rounded-pill text-foreground hover:bg-surface"
        >
          <UsersRound className="size-5" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
