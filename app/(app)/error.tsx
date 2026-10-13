"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState
      description="Algo deu errado ao abrir esta tela. Seus dados não foram alterados."
      action={
        <Button variant="secondary" onClick={() => retry()}>
          Tentar de novo
        </Button>
      }
    />
  );
}
