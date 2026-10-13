"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { MODULES, isSectionActive } from "@/lib/modules";
import { cn } from "@/lib/utils";

/** Navegação de desktop (≥ md): módulos e suas seções. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r bg-background px-4 py-6 md:flex">
      <Logo className="px-3" />
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
                        "relative flex min-h-touch items-center gap-3 rounded-sm px-3 text-body-large transition-colors duration-150",
                        active
                          ? "bg-surface font-semibold text-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-pill before:bg-foreground"
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
      <ThemeToggle variant="full" />
    </aside>
  );
}
