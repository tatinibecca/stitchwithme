import type { Metadata } from "next";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { revokeInvite } from "@/app/actions/household";
import { MemberAvatar } from "@/components/finance/member-avatar";
import { InvitePanel } from "@/components/household/invite-panel";
import { PeoplePanel, type PersonRow } from "@/components/household/people-panel";
import { PageHeader } from "@/components/page-header";
import { Mascot } from "@/components/brand/mascot";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { requireHousehold } from "@/lib/auth/dal";
import { mockFinanceData } from "@/lib/finance/mock-data";
import { formatDueDate } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nossa casa" };

interface MemberRow {
  id: string;
  user_id: string;
  display_name: string;
  role: "owner" | "member";
}
interface InviteRow {
  id: string;
  expires_at: string;
}

export default function HouseholdPage({ searchParams }: PageProps<"/casa">) {
  return (
    <Suspense fallback={<HouseholdSkeleton />}>
      <HouseholdContent searchParams={searchParams} />
    </Suspense>
  );
}

function Panel({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-elevation-1 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-subtitle font-bold">
          {title}
        </h2>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

async function HouseholdContent({ searchParams }: Pick<PageProps<"/casa">, "searchParams">) {
  const [viewer, params] = await Promise.all([requireHousehold(), searchParams]);
  const demo = viewer.mode === "demo";

  let householdId = "demo";
  let householdName = "Casa da Becca e do Thiago";
  let members: MemberRow[];
  let people: PersonRow[];
  let invites: InviteRow[] = [];
  let currentUserId = "usr_becca";

  if (demo) {
    members = mockFinanceData.members.map((m) => ({ id: m.id, user_id: m.user_id, display_name: m.display_name, role: m.role }));
    people = [{ id: "demo_martha", display_name: "Martha" }];
  } else {
    householdId = viewer.membership.householdId;
    householdName = viewer.membership.householdName;
    currentUserId = viewer.userId;
    const supabase = await createSupabaseServerClient();
    const [m, p, i] = await Promise.all([
      supabase.from("members").select("id, user_id, display_name, role").order("created_at"),
      supabase.from("people").select("id, display_name").is("member_id", null).order("display_name"),
      supabase
        .from("household_invites")
        .select("id, expires_at")
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
    ]);
    members = (m.data ?? []) as MemberRow[];
    people = (p.data ?? []) as PersonRow[];
    invites = (i.data ?? []) as InviteRow[];
  }

  const alone = members.length < 2;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Nossa casa" description={householdName} />

      {demo && (
        <p role="note" className="rounded-sm bg-status-info-bg px-4 py-3 text-body text-status-info-fg">
          Modo demonstração: dados fictícios. Com o login configurado, aqui você convida e gerencia as pessoas da casa.
        </p>
      )}

      {params.nova === "1" && !demo && (
        <div className="flex items-center gap-4 rounded-lg bg-accent p-4 text-accent-foreground">
          <Mascot pose="celebrando" size={72} className="shrink-0" />
          <div>
            <p className="text-subtitle font-bold">Casa criada!</p>
            <p className="text-body">Agora convide quem mora com você para ver tudo junto.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Panel id="membros" title="Quem usa o app" description="Os dois veem e editam tudo da casa.">
          <ul role="list">
            {members.map((m, index) => (
              <li key={m.id} className="flex items-center gap-3 border-t py-3 first:border-t-0">
                <MemberAvatar member={m} index={index} size="md" />
                <span className="flex-1 font-semibold">
                  {m.display_name}
                  {m.user_id === currentUserId && <span className="font-normal text-muted-foreground"> (você)</span>}
                </span>
                {m.role === "owner" && <span className="text-body-small text-muted-foreground">Criou a casa</span>}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t pt-4">
            <h3 className="font-sans text-body-large font-bold">{alone ? "Convide quem mora com você" : "Convidar mais alguém"}</h3>
            <InvitePanel disabled={demo} />
            {invites.length > 0 && (
              <ul role="list" className="flex flex-col gap-2">
                {invites.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-surface px-4 py-2 text-body">
                    <span>Convite pendente · vale até {formatDueDate(inv.expires_at.slice(0, 10))}</span>
                    <form action={revokeInvite}>
                      <input type="hidden" name="id" value={inv.id} />
                      <Button type="submit" variant="ghost" className="min-h-11 px-3">
                        Cancelar convite
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        <Panel
          id="pessoas"
          title="Pessoas sem login"
          description="Quem usa um cartão da casa mas não usa o app, como um familiar. Elas podem ser responsáveis por gastos."
        >
          <PeoplePanel householdId={householdId} people={people} readOnly={demo} />
        </Panel>
      </div>

      {!demo && (
        <form action={signOut}>
          <Button type="submit" variant="ghost">
            <LogOut /> Sair da conta
          </Button>
        </form>
      )}
    </div>
  );
}

function HouseholdSkeleton() {
  return (
    <div role="status" aria-label="Carregando a casa" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
