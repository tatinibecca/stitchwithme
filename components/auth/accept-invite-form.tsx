"use client";

import { useActionState } from "react";
import { acceptInvite, type FormState } from "@/app/actions/household";
import { FormError } from "@/components/auth/auth-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";

export function AcceptInviteForm({ token, householdName }: { token: string; householdName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(acceptInvite, { status: "idle" });
  const error = state.status === "error" ? state : null;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {error && !error.field && <FormError id="erro-convite" message={error.message} />}
      <TextField
        label="Seu nome"
        name="displayName"
        required
        maxLength={40}
        autoComplete="given-name"
        hint="É assim que você aparece na casa."
        defaultValue={error?.values?.displayName ?? ""}
        error={error?.field === "displayName" ? error.message : undefined}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando…" : `Entrar em ${householdName}`}
      </Button>
    </form>
  );
}
