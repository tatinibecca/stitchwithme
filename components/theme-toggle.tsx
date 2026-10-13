"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  readThemePreference,
  setThemePreference,
  subscribeToTheme,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Sistema", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
];

/**
 * `compact`: só ícones (rótulo acessível mantido) — para o header do celular.
 * `full`: ocupa a largura disponível, com rótulos — para a sidebar.
 */
export function ThemeToggle({ variant = "auto", className }: { variant?: "auto" | "compact" | "full"; className?: string }) {
  const current = useSyncExternalStore(subscribeToTheme, readThemePreference, () => "system" as const);

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Tema</legend>
      <div className={cn("rounded-pill border border-input p-1", variant === "full" ? "flex w-full" : "inline-flex")}>
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const selected = current === value;
          return (
            <label
              key={value}
              className={cn(
                "relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-pill font-medium transition-colors duration-150",
                variant === "full" ? "flex-1 gap-1 px-2 text-body-small" : "px-3 text-body",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                selected ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={selected}
                onChange={() => setThemePreference(value)}
                className="sr-only"
              />
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className={cn(variant === "compact" && "sr-only", variant === "auto" && "sr-only sm:not-sr-only")}>
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
