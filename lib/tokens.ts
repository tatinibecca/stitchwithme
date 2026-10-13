import { contrastRatio } from "./contrast";

export type ThemeName = "light" | "dark";
export type ThemeTokens = Record<string, string>;

/** Lê as variáveis de cor hex dos blocos `:root` e `.dark` de app/globals.css. */
export function parseThemeTokens(css: string): Record<ThemeName, ThemeTokens> {
  return {
    light: readBlock(css, ":root"),
    dark: readBlock(css, ".dark"),
  };
}

function readBlock(css: string, selector: string): ThemeTokens {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!block) throw new Error(`Bloco ${selector} não encontrado em globals.css`);
  const tokens: ThemeTokens = {};
  for (const [, name, value] of block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
    tokens[name] = value.toLowerCase();
  }
  return tokens;
}

export type PairKind = "text" | "ui";

export interface ContrastPair {
  /** Token usado como texto/ícone/borda */
  fg: string;
  /** Token usado como fundo */
  bg: string;
  kind: PairKind;
  usage: string;
}

/** Mínimos WCAG 2.1 AA: 4.5:1 para texto normal, 3:1 para componentes de interface (1.4.11). */
export const MIN_RATIO: Record<PairKind, number> = { text: 4.5, ui: 3 };

/**
 * Todo par texto/fundo que a interface usa. Ao criar um novo uso de cor,
 * adicione o par aqui — o teste garante o contraste nos dois temas.
 */
export const CONTRAST_PAIRS: ContrastPair[] = [
  { fg: "foreground", bg: "background", kind: "text", usage: "Texto principal" },
  { fg: "foreground", bg: "surface", kind: "text", usage: "Texto em faixas e campos" },
  { fg: "foreground", bg: "card", kind: "text", usage: "Texto em cards" },
  { fg: "foreground-secondary", bg: "background", kind: "text", usage: "Texto de apoio" },
  { fg: "foreground-secondary", bg: "surface", kind: "text", usage: "Texto de apoio em faixas" },
  { fg: "foreground-secondary", bg: "card", kind: "text", usage: "Texto de apoio em cards" },
  { fg: "neutral", bg: "background", kind: "text", usage: "Ícones e rótulos secundários (só no fundo)" },
  { fg: "primary-foreground", bg: "primary", kind: "text", usage: "Rótulo do botão primário" },
  { fg: "primary-foreground", bg: "primary-hover", kind: "text", usage: "Rótulo do botão primário (hover)" },
  { fg: "primary", bg: "background", kind: "ui", usage: "Borda/ícone coral sobre o fundo" },
  { fg: "destructive", bg: "background", kind: "text", usage: "Mensagem de erro" },
  { fg: "destructive", bg: "card", kind: "text", usage: "Mensagem de erro em card" },
  { fg: "input", bg: "background", kind: "ui", usage: "Borda de campo" },
  { fg: "input", bg: "surface", kind: "ui", usage: "Borda de campo em faixa" },
  { fg: "input", bg: "card", kind: "ui", usage: "Borda de campo em card" },
  { fg: "ring", bg: "background", kind: "ui", usage: "Anel de foco" },
  { fg: "ring", bg: "surface", kind: "ui", usage: "Anel de foco em faixa" },
  { fg: "status-paid-fg", bg: "status-paid-bg", kind: "text", usage: "Badge Pago" },
  { fg: "status-due-fg", bg: "status-due-bg", kind: "text", usage: "Badge A vencer" },
  { fg: "status-overdue-fg", bg: "status-overdue-bg", kind: "text", usage: "Badge Atrasado" },
  { fg: "status-info-fg", bg: "status-info-bg", kind: "text", usage: "Badge Info" },
  { fg: "status-paid-fg", bg: "card", kind: "text", usage: "Valor pago em card" },
  { fg: "status-due-fg", bg: "card", kind: "text", usage: "Valor a vencer em card" },
  { fg: "status-overdue-fg", bg: "card", kind: "text", usage: "Valor atrasado em card" },
  { fg: "status-info-fg", bg: "card", kind: "text", usage: "Texto informativo em card" },
  { fg: "status-overdue-fg", bg: "background", kind: "text", usage: "Valor atrasado no fundo" },
  { fg: "foreground", bg: "status-overdue-bg", kind: "text", usage: "Botão dentro do estado de erro" },
];

export interface ContrastResult extends ContrastPair {
  theme: ThemeName;
  fgHex: string;
  bgHex: string;
  ratio: number;
  min: number;
  passes: boolean;
}

export function evaluateContrast(themes: Record<ThemeName, ThemeTokens>): ContrastResult[] {
  return (Object.keys(themes) as ThemeName[]).flatMap((theme) =>
    CONTRAST_PAIRS.map((pair) => {
      const fgHex = themes[theme][pair.fg];
      const bgHex = themes[theme][pair.bg];
      if (!fgHex || !bgHex) {
        throw new Error(`Token ausente no tema ${theme}: ${!fgHex ? pair.fg : pair.bg}`);
      }
      const ratio = contrastRatio(fgHex, bgHex);
      const min = MIN_RATIO[pair.kind];
      return { ...pair, theme, fgHex, bgHex, ratio, min, passes: ratio >= min };
    }),
  );
}
