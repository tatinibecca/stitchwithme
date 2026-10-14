"use client";

import { useActionState, useRef, useState } from "react";
import { Check, Copy, Link2, MessageCircle } from "lucide-react";
import { createInvite, type InviteState } from "@/app/actions/household";
import { FormError } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InvitePanel({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<InviteState>(createInvite, { status: "idle" });
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      inputRef.current?.select();
    }
  }

  if (state.status === "created") {
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Entra na nossa casa na Casita: ${state.url}`)}`;
    return (
      <div className="flex flex-col gap-3">
        <label htmlFor="link-convite" className="text-body font-semibold">
          Link de convite (vale por 7 dias, para uma pessoa)
        </label>
        <Input id="link-convite" ref={inputRef} readOnly value={state.url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-body" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => copy(state.url)}>
            {copied ? <Check /> : <Copy />} {copied ? "Link copiado" : "Copiar link"}
          </Button>
          <Button asChild variant="secondary">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Enviar pelo WhatsApp
            </a>
          </Button>
        </div>
        <p role="status" className="sr-only">
          {copied ? "Link copiado" : ""}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.status === "error" && <FormError id="erro-convite" message={state.message} />}
      <Button type="submit" variant="secondary" disabled={pending || disabled} className="self-start">
        <Link2 /> {pending ? "Gerando…" : "Gerar link de convite"}
      </Button>
    </form>
  );
}
