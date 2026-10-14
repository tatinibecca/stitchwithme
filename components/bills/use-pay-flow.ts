"use client";

import { useState, useTransition } from "react";
import { unmarkBillPaid } from "@/app/actions/bills";
import type { PayTarget } from "./pay-dialog";

/** Estado compartilhado do fluxo "marcar como paga" + aviso com desfazer. */
export function usePayFlow() {
  const [target, setTarget] = useState<PayTarget | null>(null);
  const [lastPaid, setLastPaid] = useState<PayTarget | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);
  const [undoing, startUndo] = useTransition();

  return {
    target,
    open: (t: PayTarget) => {
      setUndoError(null);
      setTarget(t);
    },
    close: () => setTarget(null),
    paid: (t: PayTarget) => {
      setTarget(null);
      setLastPaid(t);
    },
    lastPaid,
    undoError,
    undoing,
    undo: () => {
      if (!lastPaid) return;
      startUndo(async () => {
        const result = await unmarkBillPaid(lastPaid.occurrenceId);
        if (result.ok) setLastPaid(null);
        else setUndoError(result.message);
      });
    },
    dismiss: () => setLastPaid(null),
  };
}
