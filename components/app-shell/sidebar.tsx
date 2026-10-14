"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsersRound } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MODULES, isSectionActive } from "@/lib/modules";
import { cn } from "@/lib/utils";

/** Navegação de desktop (≥ md): módulos e suas seções. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r bg-background px-4 py-6 md:flex">
      <Logo className="px-2" height={44} />
      <nav aria-label="Principal" className="flex flex-1 flex-col gap-6">
        {MODULES.map((appModule) => (
          <div key={appModule.id} className="flex flex-col gap-1">
            <p className="label-caps flex items-center gap-2 px-3 pb-1 font-sans text-muted-foreground">
              <appModule.icon className="size-4" aria-hidden="true" />
              {appModule.label}
            </p>
            <ul role="list" className="flex flex-col gap-1">
              {appModule.sections.map((section) => {
                const active = isSectionActive(pathname, section, appModule);
                return (
                  <li key={section.href}>
                    <Link
                      href={section.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex min-h-touch items-center gap-3 rounded-pill px-4 text-body-large transition-colors duration-150",
                        active
                          ? "bg-accent-soft font-bold text-foreground"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground",
                      )}
                    >
                      <section.icon className="size-5 shrink-0" aria-hidden="true" />
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <Link
        href="/casa"
        aria-current={pathname === "/casa" ? "page" : undefined}
        className={cn(
          "flex min-h-touch items-center gap-3 rounded-pill px-4 text-body-large transition-colors duration-150",
          pathname === "/casa" ? "bg-accent-soft font-bold text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
        )}
      >
        <UsersRound className="size-5 shrink-0" aria-hidden="true" />
        Nossa casa
      </Link>
      <ThemeToggle variant="full" />
    </aside>
  );
}
