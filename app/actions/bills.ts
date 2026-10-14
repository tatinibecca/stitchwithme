"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { friendlyDbError } from "@/lib/auth/errors";
import { parseBillForm } from "@/lib/bills/form";
import { parseBRLToCents } from "@/lib/bills/money";
import { todayInSaoPaulo } from "@/lib/bills/recurrence";
import { getViewer } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEMO_MESSAGE = "No modo demonstração nada é salvo. Configure o login para usar de verdade.";

export type BillFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

function valuesOf(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") values[key] = value;
  return values;
}

async function liveViewer() {
  const viewer = await getViewer();
  if (viewer.mode !== "signed_in" || !viewer.membership) return null;
  return viewer;
}

function revalidateFinance() {
  revalidatePath("/financas", "layout");
}

export async function createBill(_prev: BillFormState, formData: FormData): Promise<BillFormState> {
  const parsed = parseBillForm(formData);
  if ("fieldErrors" in parsed) return { status: "error", message: "Confira os campos destacados.", fieldErrors: parsed.fieldErrors, values: valuesOf(formData) };
  const viewer = await liveViewer();
  if (!viewer) return { status: "error", message: DEMO_MESSAGE };

  const today = todayInSaoPaulo();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("bills").insert({
    ...parsed.bill,
    household_id: viewer.membership!.householdId,
    starts_on: `${today.slice(0, 7)}-01`,
  });
  if (error) return { status: "error", message: friendlyDbError(error) };
  await supabase.rpc("generate_bill_occurrences", { p_month: `${today.slice(0, 7)}-01` });
  revalidateFinance();
  redirect(`/financas/contas?salvo=${encodeURIComponent(parsed.bill.name)}`);
}

export async function updateBill(_prev: BillFormState, formData: FormData): Promise<BillFormState> {
  const viewer = await liveViewer();
  const scope = formData.get("scope") === "this" ? "this" : "from";
  const billId = String(formData.get("bill_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const supabase = viewer ? await createSupabaseServerClient() : null;

  if (scope === "this") {
    const amount = parseBRLToCents(String(formData.get("amount") ?? ""));
    const dueDate = String(formData.get("due_date") ?? "");
    const fieldErrors: Record<string, string> = {};
    if (amount === null) fieldErrors.amount = "Informe o valor em reais, por exemplo 211,37.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || dueDate.slice(0, 7) !== month) {
      fieldErrors.due_date = "Escolha uma data dentro do mesmo mês.";
    }
    if (Object.keys(fieldErrors).length) return { status: "error", message: "Confira os campos destacados.", fieldErrors, values: valuesOf(formData) };
    if (!supabase) return { status: "error", message: DEMO_MESSAGE };
    const { error } = await supabase.rpc("update_bill_occurrence", {
      p_occurrence: String(formData.get("occurrence_id") ?? ""),
      p_expected_amount: amount,
      p_due_date: dueDate,
    });
    if (error) {
      return {
        status: "error",
        message: error.message.includes("occurrence_not_editable")
          ? "Esta ocorrência já foi paga ou a data saiu do mês. Desfaça o pagamento ou escolha uma data no mesmo mês."
          : friendlyDbError(error),
      };
    }
  } else {
    const parsed = parseBillForm(formData);
    if ("fieldErrors" in parsed) return { status: "error", message: "Confira os campos destacados.", fieldErrors: parsed.fieldErrors, values: valuesOf(formData) };
    if (!supabase) return { status: "error", message: DEMO_MESSAGE };
    const { error } = await supabase.from("bills").update(parsed.bill).eq("id", billId);
    if (error) return { status: "error", message: friendlyDbError(error) };
    const { error: reapplyError } = await supabase.rpc("reapply_bill_from", { p_bill: billId, p_from_month: `${month}-01` });
    if (reapplyError) return { status: "error", message: friendlyDbError(reapplyError) };
  }

  revalidateFinance();
  redirect(`/financas/contas?mes=${month}&salvo=1`);
}

export type PayResult = { ok: true } | { ok: false; message: string };

export async function markBillPaid(input: { occurrenceId: string; amount: string; paidOn: string }): Promise<PayResult> {
  const amount = parseBRLToCents(input.amount);
  if (amount === null) return { ok: false, message: "Informe o valor pago em reais, por exemplo 211,37." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn)) return { ok: false, message: "Informe a data do pagamento." };
  if (input.paidOn > todayInSaoPaulo()) return { ok: false, message: "A data do pagamento não pode estar no futuro." };
  const viewer = await liveViewer();
  if (!viewer) return { ok: false, message: DEMO_MESSAGE };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_bill_occurrence_paid", {
    p_occurrence: input.occurrenceId,
    p_amount: amount,
    p_paid_on: input.paidOn,
  });
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateFinance();
  return { ok: true };
}

export async function unmarkBillPaid(occurrenceId: string): Promise<PayResult> {
  const viewer = await liveViewer();
  if (!viewer) return { ok: false, message: DEMO_MESSAGE };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("unmark_bill_occurrence_paid", { p_occurrence: occurrenceId });
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateFinance();
  return { ok: true };
}

export async function setBillActive(billId: string, active: boolean): Promise<PayResult> {
  const viewer = await liveViewer();
  if (!viewer) return { ok: false, message: DEMO_MESSAGE };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("bills").update({ active }).eq("id", billId);
  if (error) return { ok: false, message: friendlyDbError(error) };
  revalidateFinance();
  return { ok: true };
}
