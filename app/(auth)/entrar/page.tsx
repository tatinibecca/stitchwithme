import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, FormError } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getViewer } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/errors";

export const metadata: Metadata = { title: "Entrar" };

export default function SignInPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <AuthCard mascot="acenando" title="Entrar na Casita" description="As finanças da casa num só lugar, para vocês dois.">
      <Suspense fallback={<div className="h-40" aria-hidden="true" />}>
        <SignInContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function SignInContent({ searchParams }: Pick<PageProps<"/entrar">, "searchParams">) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const viewer = await getViewer();

  if (viewer.mode === "demo") {
    return (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-body text-muted-foreground">
          O login ainda não está configurado neste ambiente. Você pode ver o app com dados fictícios.
        </p>
        <Link href="/financas" className="font-bold text-link underline underline-offset-4">
          Ver o app com dados fictícios
        </Link>
      </div>
    );
  }
  if (viewer.mode === "signed_in") redirect(viewer.membership ? next : "/comecar");

  return (
    <div className="flex flex-col gap-4">
      {params.erro === "link" && (
        <FormError id="erro-link" message="Este link de acesso expirou ou já foi usado. Peça um novo abaixo." />
      )}
      <SignInForm next={next} />
    </div>
  );
}
