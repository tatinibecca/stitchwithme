/**
 * Acesso aos dados de Finanças.
 * - Modo demonstração (sem Supabase): devolve os dados fictícios.
 * - Com login: lê do Supabase o que já existe no banco (Fase 2: contas fixas);
 *   faturas, assinaturas e metas entram nas próximas fases.
 */
import { requireHousehold } from "@/lib/auth/dal";
import { todayInSaoPaulo } from "@/lib/bills/recurrence";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MOCK_CURRENT_MEMBER_ID, MOCK_TODAY, emptyFinanceData, mockFinanceData } from "./mock-data";
import type { Bill, BillOccurrence, Category, FinanceData, Id, ISODate, Member, YearMonth } from "./types";

export interface FinanceSnapshot {
  data: FinanceData;
  /** "Hoje" no fuso America/Sao_Paulo. Fixo nos mocks para o cenário não mudar com o tempo. */
  today: ISODate;
  currentMemberId: Id;
  live: boolean;
}

export async function getFinanceSnapshot(
  options: { simulateEmpty?: boolean; month?: YearMonth } = {},
): Promise<FinanceSnapshot> {
  const viewer = await requireHousehold();
  if (viewer.mode === "demo") {
    return {
      data: options.simulateEmpty ? emptyFinanceData : mockFinanceData,
      today: MOCK_TODAY,
      currentMemberId: MOCK_CURRENT_MEMBER_ID,
      live: false,
    };
  }

  const today = todayInSaoPaulo();
  const month = options.month ?? today.slice(0, 7);
  const supabase = await createSupabaseServerClient();
  // Garante as ocorrências do mês aberto (idempotente).
  await supabase.rpc("generate_bill_occurrences", { p_month: `${month}-01` });

  const [household, members, categories, bills, occurrences] = await Promise.all([
    supabase.from("households").select("id, name, created_at").single(),
    supabase.from("members").select("id, household_id, user_id, display_name, role").order("created_at"),
    supabase.from("categories").select("id, household_id, name, icon, color, is_default").order("name"),
    supabase.from("bills").select("*").order("name"),
    supabase.from("bill_occurrences").select("*").eq("reference_month", `${month}-01`),
  ]);

  const data: FinanceData = {
    ...emptyFinanceData,
    household: household.data ?? { id: viewer.membership.householdId, name: viewer.membership.householdName, created_at: "" },
    members: (members.data ?? []) as Member[],
    categories: (categories.data ?? []) as Category[],
    bills: (bills.data ?? []) as Bill[],
    bill_occurrences: (occurrences.data ?? []) as BillOccurrence[],
  };

  return { data, today, currentMemberId: viewer.membership.memberId, live: true };
}
