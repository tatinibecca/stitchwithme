"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath, validateEmail } from "@/lib/auth/errors";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState =
  | { status: "idle" }
  | { status: "error"; message: string; email: string }
  | { status: "sent"; email: string };

export async function signInWithEmail(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const raw = String(formData.get("email") ?? "");
  const email = validateEmail(raw);
  if ("error" in email) return { status: "error", message: email.error, email: raw };
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "O login ainda não está configurado neste ambiente.", email: email.value };
  }

  const origin = (await headers()).get("origin") ?? undefined;
  const next = safeNextPath(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: { emailRedirectTo: `${getSiteUrl(origin)}/auth/confirm?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    const tooMany = error.status === 429;
    return {
      status: "error",
      email: email.value,
      message: tooMany
        ? "Muitos pedidos de link em pouco tempo. Espere um minuto e tente de novo."
        : "Não conseguimos enviar o link agora. Confira o e-mail e tente de novo.",
    };
  }
  return { status: "sent", email: email.value };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/entrar");
}
