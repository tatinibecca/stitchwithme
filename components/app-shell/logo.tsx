import Link from "next/link";
import { Logo as BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** Logo da navegação: leva ao início. O nome acessível vem do alt="Casita" da imagem. */
export function Logo({ className, height = 40 }: { className?: string; height?: number }) {
  return (
    <Link href="/financas" className={cn("inline-flex min-h-11 items-center rounded-sm", className)}>
      <BrandLogo variant="horizontal" height={height} priority />
    </Link>
  );
}
