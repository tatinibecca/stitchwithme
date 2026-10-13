import Image from "next/image";
import { cn } from "@/lib/utils";

export type LogoVariant = "horizontal" | "wordmark" | "stacked" | "symbol";

const FILES: Record<LogoVariant, { light: string; dark: string; width: number; height: number }> = {
  horizontal: {
    light: "/brand/casita-logo-horizontal.svg",
    dark: "/brand/casita-logo-horizontal-dark.svg",
    width: 480,
    height: 170,
  },
  wordmark: { light: "/brand/casita-wordmark.svg", dark: "/brand/casita-wordmark-dark.svg", width: 368, height: 140 },
  stacked: {
    light: "/brand/casita-logo-empilhado.svg",
    dark: "/brand/casita-logo-empilhado-dark.svg",
    width: 360,
    height: 370,
  },
  // O símbolo tem uma versão só: o mascote funciona nos dois temas.
  symbol: { light: "/brand/casita-simbolo.svg", dark: "/brand/casita-simbolo.svg", width: 250, height: 230 },
};

/**
 * Logo da Casita (SVG com o wordmark em curvas, Nunito 900).
 * Sem `theme`, troca sozinho para a versão escura quando o <html> tem a classe .dark
 * (só CSS: sem flash e sem JavaScript). A versão escondida fica fora da árvore de acessibilidade.
 */
export function Logo({
  variant = "horizontal",
  theme,
  height = 40,
  className,
  priority,
}: {
  variant?: LogoVariant;
  /** Força uma versão, ex.: logo claro sobre a faixa escura de uma splash */
  theme?: "light" | "dark";
  /** Altura em px; a largura segue a proporção do arquivo */
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const file = FILES[variant];
  const width = Math.round((file.width / file.height) * height);
  const common = { width, height, unoptimized: true, priority, style: { height, width: "auto" } } as const;

  if (theme) {
    return <Image src={theme === "dark" ? file.dark : file.light} alt="Casita" className={className} {...common} />;
  }
  return (
    <>
      <Image src={file.light} alt="Casita" className={cn("dark:hidden", className)} {...common} />
      <Image src={file.dark} alt="Casita" className={cn("hidden dark:block", className)} {...common} />
    </>
  );
}
