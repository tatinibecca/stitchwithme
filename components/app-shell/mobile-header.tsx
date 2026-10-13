import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <Logo />
      <ThemeToggle variant="compact" />
    </header>
  );
}
