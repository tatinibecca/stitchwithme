import { Suspense } from "react";
import { AppShell } from "@/components/app-shell/app-shell";
import { requireHousehold } from "@/lib/auth/dal";

/** Garante login e casa em todas as telas do app (sem login → /entrar, sem casa → /comecar). */
async function HouseholdGuard() {
  await requireHousehold();
  return null;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppShell>
      {children}
      <Suspense fallback={null}>
        <HouseholdGuard />
      </Suspense>
    </AppShell>
  );
}
