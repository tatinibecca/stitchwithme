"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActiveModule, isSectionActive } from "@/lib/modules";
import { cn } from "@/lib/utils";

/** Navegação de celular (< md): até 5 seções do módulo atual, sempre com rótulo. */
export function BottomNav() {
  const pathname = usePathname();
  const activeModule = findActiveModule(pathname);

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul role="list" className="grid h-bottom-nav grid-cols-5">
        {activeModule.sections.slice(0, 5).map((section) => {
          const active = isSectionActive(pathname, section, activeModule);
          return (
            <li key={section.href} className="flex">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-label font-semibold transition-colors duration-150",
                  active
                    ? "text-foreground after:absolute after:inset-x-4 after:top-0 after:h-0.5 after:rounded-pill after:bg-foreground"
                    : "text-muted-foreground",
                )}
              >
                <section.icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                <span className="max-w-full truncate px-0.5">{section.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
