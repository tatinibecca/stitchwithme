import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { CreateHouseholdForm } from "@/components/auth/create-household-form";
import { getViewer } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Criar a casa" };

export default function StartPage() {
  return (
    <AuthCard
      mascot="acenando"
      title="Vamos criar a sua casa"
      description="Depois você convida quem mora com você para ver tudo junto."
    >
      <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
        <StartContent />
      </Suspense>
    </AuthCard>
  );
}

async function StartContent() {
  const viewer = await getViewer();
  if (viewer.mode === "demo") redirect("/financas");
  if (viewer.mode === "signed_out") redirect("/entrar?next=/comecar");
  if (viewer.membership) redirect("/financas");
  return <CreateHouseholdForm />;
}
