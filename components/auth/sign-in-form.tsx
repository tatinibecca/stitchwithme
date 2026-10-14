"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { signInWithEmail, type SignInState } from "@/app/actions/auth";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithEmail, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="flex flex-col gap-4 text-center">
        <p className="text-body-large">
          Enviamos um link de acesso para <strong className="font-bold break-all">{state.email}</strong>.
        </p>
        <p className="text-body text-muted-foreground">
          Abra o e-mail neste aparelho e toque no link. Se não aparecer em 1 minuto, olhe a caixa de spam.
        </p>
        <form action={action}>
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="ghost" disabled={pending}>
            Enviar de novo
          </Button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.status === "error" ? state.email : ""}
        error={state.status === "error" ? state.message : undefined}
        hint="Sem senha: mandamos um link para você entrar."
      />
      <Button type="submit" disabled={pending} aria-disabled={pending}>
        <Mail /> {pending ? "Enviando…" : "Receber link de acesso"}
      </Button>
    </form>
  );
}
