import type { LucideIcon } from "lucide-react";
import { CreditCard, House, Receipt, Repeat, Target, Wallet } from "lucide-react";

export interface ModuleSection {
  href: string;
  label: string;
  /** Rótulo curto para a barra inferior (até ~10 caracteres) */
  shortLabel: string;
  icon: LucideIcon;
}

export interface AppModule {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  sections: ModuleSection[];
}

/**
 * Registro de módulos da casa. Para adicionar um módulo (Mercado, Treino...),
 * inclua uma entrada aqui — sidebar e barra inferior se ajustam sozinhas.
 * Só entram módulos já disponíveis: nada de itens "em breve" (PRD §8).
 */
export const MODULES: AppModule[] = [
  {
    id: "financas",
    label: "Finanças",
    icon: Wallet,
    href: "/financas",
    sections: [
      { href: "/financas", label: "Visão do mês", shortLabel: "Mês", icon: House },
      { href: "/financas/contas", label: "Contas fixas", shortLabel: "Contas", icon: Receipt },
      { href: "/financas/faturas", label: "Faturas", shortLabel: "Faturas", icon: CreditCard },
      { href: "/financas/assinaturas", label: "Assinaturas", shortLabel: "Assinaturas", icon: Repeat },
      { href: "/financas/metas", label: "Metas", shortLabel: "Metas", icon: Target },
    ],
  },
];

/** A raiz do módulo só fica ativa na rota exata; as seções, também nas sub-rotas. */
export function isSectionActive(pathname: string, section: ModuleSection, appModule: AppModule): boolean {
  if (section.href === appModule.href) return pathname === appModule.href;
  return pathname === section.href || pathname.startsWith(`${section.href}/`);
}

export function findActiveModule(pathname: string): AppModule {
  return MODULES.find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`)) ?? MODULES[0];
}
