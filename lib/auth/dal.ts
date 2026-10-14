import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface Membership {
  householdId: string;
  householdName: string;
  memberId: string;
  displayName: string;
  role: "owner" | "member";
}

export type Viewer =
  /** Sem Supabase configurado: telas com dados fictícios, sem login */
  | { mode: "demo" }
  | { mode: "signed_out" }
  | { mode: "signed_in"; userId: string; email: string | null; membership: Membership | null };

/**
 * Camada de acesso (DAL): quem está logado e de qual casa. Uma leitura por
 * requisição (React cache). Chame só dentro de um <Suspense>, porque lê cookies.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  if (!isSupabaseConfigured()) return { mode: "demo" };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { mode: "signed_out" };

  const { data: member } = await supabase
    .from("members")
    .select("id, display_name, role, household_id, households(name)")
    .eq("user_id", claims.sub)
    .maybeSingle();

  const household = member?.households as { name: string } | { name: string }[] | null | undefined;
  const householdName = Array.isArray(household) ? household[0]?.name : household?.name;

  return {
    mode: "signed_in",
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    membership: member
      ? {
          householdId: member.household_id,
          householdName: householdName ?? "Nossa casa",
          memberId: member.id,
          displayName: member.display_name,
          role: member.role,
        }
      : null,
  };
});

/** Exige login e casa. Sem login → /entrar; sem casa → /comecar. No modo demonstração, passa. */
export async function requireHousehold(): Promise<Extract<Viewer, { mode: "demo" }> | { mode: "signed_in"; userId: string; membership: Membership }> {
  const viewer = await getViewer();
  if (viewer.mode === "demo") return viewer;
  if (viewer.mode === "signed_out") redirect("/entrar");
  if (!viewer.membership) redirect("/comecar");
  return { mode: "signed_in", userId: viewer.userId, membership: viewer.membership };
}
