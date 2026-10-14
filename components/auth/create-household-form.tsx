"use client";

import { useActionState } from "react";
import { createHousehold, type FormState } from "@/app/actions/household";
import { FormError } from "@/components/auth/auth-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";

export function CreateHouseholdForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createHousehold, { status: "idle" });
  const error = state.status === "error" ? state : null;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {error && !error.field && <FormError id="erro-casa" message={error.message} />}
      <TextField
        label="Nome da casa"
        name="name"
        required
        maxLength={60}
        placeholder="Ex.: Casa da Becca e do Thiago"
        defaultValue={error?.values?.name ?? ""}
        error={error?.field === "name" ? error.message : undefined}
      />
      <TextField
        label="Seu nome"
        name="displayName"
        required
        maxLength={40}
        autoComplete="given-name"
        hint="É assim que você aparece para quem mora com você."
        defaultValue={error?.values?.displayName ?? ""}
        error={error?.field === "displayName" ? error.message : undefined}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Criando…" : "Criar a casa"}
      </Button>
    </form>
  );
}
