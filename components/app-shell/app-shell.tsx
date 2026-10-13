import { Suspense } from "react";
import { BottomNav } from "./bottom-nav";
import { MobileHeader } from "./mobile-header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-sm bg-foreground px-4 py-3 font-semibold text-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-3"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh">
        <Suspense fallback={<div className="hidden w-64 shrink-0 border-r md:block" />}>
          <Sidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main
            id="conteudo"
            tabIndex={-1}
            className="mx-auto w-full max-w-page flex-1 px-6 pt-6 pb-[calc(56px+env(safe-area-inset-bottom)+1.5rem)] focus:outline-none md:px-10 md:pt-10 md:pb-12"
          >
            {children}
          </main>
        </div>
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
