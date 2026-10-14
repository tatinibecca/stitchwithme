import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { getViewer } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Convite", robots: { index: false, follow: false } };

const STATUS_MESSAGE: Record<string, { title: string; description: string }> = {
  not_found: { title: "Convite não encontrado", description: "Confira se o link foi copiado inteiro ou peça um novo para quem convidou você." },
  used: { title: "Este convite já foi usado", description: "Cada link vale para uma pessoa. Peça um link novo para quem convidou você." },
  expired: { title: "Este convite expirou", description: "Os convites valem por 7 dias. Peça um link novo para quem convidou você." },
  revoked: { title: "Este convite foi cancelado", description: "Peça um link novo para quem convidou você." },
};

export default function InvitePage({ params }: PageProps<"/convite/[token]">) {
  return (
    <Suspense fallback={<AuthCard mascot="acenando" title="Abrindo o convite…"><div className="h-32" aria-hidden="true" /></AuthCard>}>
      <InviteContent params={params} />
    </Suspense>
  );
}

async function InviteContent({ params }: Pick<PageProps<"/convite/[token]">, "params">) {
  const { token } = await params;
  const viewer = await getViewer();
  if (viewer.mode === "demo") redirect("/financas");
  if (viewer.mode === "signed_out") redirect(`/entrar?next=${encodeURIComponent(`/convite/${token}`)}`);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_household_invite", { p_token: token });
  const invite = (Array.isArray(data) ? data[0] : data) as
    | { household_name: string | null; invited_by: string | null; status: string }
    | undefined;
  const status = invite?.status ?? "not_found";

  // No MVP cada pessoa participa de uma casa só (members_one_household_per_user).
  if (viewer.membership) {
    return (
      <AuthCard mascot="feliz" title="Você já está na casa" description={`Você já faz parte de ${viewer.membership.householdName}.`}>
        <Link href="/financas" className="text-center font-bold text-link underline underline-offset-4">
          Ir para a visão do mês
        </Link>
      </AuthCard>
    );
  }

  if (status !== "valid" || !invite?.household_name) {
    const message = STATUS_MESSAGE[status] ?? STATUS_MESSAGE.not_found;
    return (
      <AuthCard title={message.title} description={message.description}>
        <Link href="/financas" className="text-center font-bold text-link underline underline-offset-4">
          Ir para o app
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      mascot="coracao"
      title={`Convite para ${invite.household_name}`}
      description={invite.invited_by ? `${invite.invited_by} quer dividir a gestão da casa com você.` : undefined}
    >
      <AcceptInviteForm token={token} householdName={invite.household_name} />
    </AuthCard>
  );
}
