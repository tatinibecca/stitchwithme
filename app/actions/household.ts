"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { friendlyDbError, validateName } from "@/lib/auth/errors";
import { getSiteUrl } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormState =
  | { status: "idle" }
  | { status: "saved"; at: number }
  | { status: "error"; message: string; field?: string; values?: Record<string, string> };

export async function createHousehold(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: String(formData.get("name") ?? ""), displayName: String(formData.get("displayName") ?? "") };
  const name = validateName(values.name, "o nome da casa", 60);
  if ("error" in name) return { status: "error", field: "name", message: name.error, values };
  const displayName = validateName(values.displayName, "seu nome", 40);
  if ("error" in displayName) return { status: "error", field: "displayName", message: displayName.error, values };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_household", { p_name: name.value, p_display_name: displayName.value });
  if (error) return { status: "error", message: friendlyDbError(error), values };
  redirect("/casa?nova=1");
}

export type InviteState = { status: "idle" } | { status: "error"; message: string } | { status: "created"; url: string };

export async function createInvite(): Promise<InviteState> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_household_invite");
  if (error || typeof data !== "string") return { status: "error", message: friendlyDbError(error) };
  const origin = (await headers()).get("origin") ?? undefined;
  revalidatePath("/casa");
  return { status: "created", url: `${getSiteUrl(origin)}/convite/${data}` };
}

export async function revokeInvite(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const supabase = await createSupabaseServerClient();
  await supabase.from("household_invites").update({ revoked_at: new Date().toISOString() }).eq("id", id).is("accepted_at", null);
  revalidatePath("/casa");
}

export async function acceptInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const values = { displayName: String(formData.get("displayName") ?? "") };
  const displayName = validateName(values.displayName, "seu nome", 40);
  if ("error" in displayName) return { status: "error", field: "displayName", message: displayName.error, values };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_household_invite", { p_token: token, p_display_name: displayName.value });
  if (error) return { status: "error", message: friendlyDbError(error), values };
  redirect("/financas");
}

export async function addPerson(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { displayName: String(formData.get("displayName") ?? "") };
  const displayName = validateName(values.displayName, "o nome da pessoa", 40);
  if ("error" in displayName) return { status: "error", field: "displayName", message: displayName.error, values };

  const supabase = await createSupabaseServerClient();
  const householdId = String(formData.get("householdId") ?? "");
  const { error } = await supabase.from("people").insert({ household_id: householdId, display_name: displayName.value });
  if (error) return { status: "error", message: friendlyDbError(error), values };
  revalidatePath("/casa");
  return { status: "saved", at: Date.now() };
}

export async function removePerson(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const supabase = await createSupabaseServerClient();
  // A RLS impede apagar pessoas ligadas a membros.
  await supabase.from("people").delete().eq("id", id).is("member_id", null);
  revalidatePath("/casa");
}
