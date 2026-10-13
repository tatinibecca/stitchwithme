# Decisões

Registro de decisões não óbvias (data · decisão · motivo).

## 2026-10-13 · Fase 0 (reduzida): base visual e estrutural

**Design system base: Coral Stay, adaptado.** As cores, a tipografia, o espaçamento, os raios e a elevação vêm do design system Coral Stay. As adaptações para WCAG 2.1 AA e para finanças estão abaixo. Fonte única dos valores: `app/globals.css`.

**Botão primário com rótulo escuro (#222 sobre coral).** O texto branco sobre `#ff5a5f` fica em 3.05:1 e não passa no AA para 16px. O texto `#222222` fica em 5.21:1. Escolha da Becca (opção A do plano), para manter o coral da marca.

**O hover do primário clareia em vez de escurecer.** O `primary-hover` do design system (`#e04e52`) com rótulo escuro fica em 4.08:1. Usamos `#ff7479`, que fica em 6.08:1.

**"Atrasado" usa vermelho, nunca coral.** Isso evita confundir alerta com marca. O coral fica só no CTA principal.

**Borda de campo própria (`--input`: `#858585` no claro, `#7a7a7a` no escuro).** O `border` do design system (`#dddddd`) fica em 1.36:1, abaixo dos 3:1 do critério 1.4.11. O `#dddddd` continua apenas para divisores decorativos.

**Tokens de status com texto escuro sobre fundo tingido.** São quatro status (pago, a vencer, atrasado e info), cada um com `-fg` e `-bg`. O `success` (`#008a05`) e o `warning` (`#e07912`) do design system não passam como texto sobre fundo tingido. O status "info" não existia no design system. O ícone usa a mesma cor do texto, e o badge sempre combina cor, ícone e texto.

**Modo escuro derivado.** O design system só tem tema claro. A paleta escura foi derivada e validada par a par. O tema é aplicado pela classe `.dark` no `<html>`, definida por um script inline antes da primeira pintura (sem flash). A preferência fica em `localStorage`, e o padrão é seguir o sistema.

**Contraste validado por teste.** Os pares texto/fundo estão listados em `lib/tokens.ts` (`CONTRAST_PAIRS`). O teste `lib/tokens.test.ts` lê `globals.css` e falha se algum par cair abaixo de 4.5:1 (texto) ou 3:1 (UI). A página `/design-system` mostra a mesma tabela. Um novo uso de cor deve entrar como par nessa lista.

**Labels de formulário em 14px semibold, com só a primeira letra maiúscula.** O design system permite esse formato em inputs. Preferimos 14px aos 12px em caixa alta por legibilidade e carga cognitiva. O estilo 12px em caixa alta (`label-caps`) fica para cabeçalhos de grupo e de tabela.

**Ícones: lucide-react.** O design system não traz um set de ícones e pede traço de 1.5–2px. O Lucide segue esse padrão e é o set padrão do shadcn/ui.

**Nome provisório no logo: "Stitchwithme"**, em Nunito Sans 800 coral. Logotipos são isentos do requisito de contraste (WCAG 1.4.3).

**`/design-system` público, com `noindex`.** A página serve de referência viva para o casal e para o agente, sem aparecer em buscadores.

**Componentes shadcn/ui escritos à mão.** O registro `ui.shadcn.com` está bloqueado pela política de rede do ambiente de desenvolvimento, então o CLI falhou. Os componentes seguem o formato do shadcn (cva + `cn` + Radix) e o `components.json` está configurado. Com a rede liberada, o `npx shadcn add <componente>` funciona normalmente.

**Navegação: registro único de módulos em `lib/modules.ts`.** A sidebar (≥ 768px) e a barra inferior (< 768px) leem a mesma lista. Hoje só existe Finanças, com 5 seções. Um módulo novo entra com uma única entrada nessa lista, e nenhum módulo aparece como "em breve" (PRD §8).

**Next.js 16 com `cacheComponents` (padrão do create-next-app 16.4).** Os componentes que usam `usePathname` ficam dentro de `Suspense` para não bloquear a pré-renderização quando surgirem rotas dinâmicas.

**`@types/node` na versão 22.** Alinha com o Node 22 do ambiente e com a peer dependency do Vitest 5.
