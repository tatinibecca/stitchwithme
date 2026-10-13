import Image from "next/image";
import { cn } from "@/lib/utils";

export type MascotPose = "acenando" | "feliz" | "coracao" | "celebrando" | "piscando";

/**
 * Mascote da Casita — sempre DECORATIVO: alt="" e aria-hidden.
 * Nunca coloque informação essencial na imagem; o texto ao lado é que comunica.
 *
 * Onde usar (docs/DECISIONS.md):
 * - estado vazio → "feliz" · tudo pago no mês → "celebrando" · boas-vindas → "acenando"
 * - erro e atraso → SEM mascote (clareza antes de fofura)
 */
export function Mascot({ pose, size = 96, className }: { pose: MascotPose; size?: number; className?: string }) {
  const height = Math.round((size * 230) / 250);
  return (
    <Image
      src={`/brand/casita-${pose}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={height}
      unoptimized
      className={cn("pointer-events-none select-none", className)}
    />
  );
}
