# App da Casa — Instruções do projeto

## Contexto
App web responsivo (PWA) para um casal gerenciar a casa. O MVP cobre apenas o módulo **Finanças**.
A especificação completa está em `docs/PRD.md`. **Leia o PRD antes de qualquer tarefa nova.**

## Stack
Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres, Auth, RLS, Edge Functions) · Vitest + Playwright · Deploy na Vercel.

## Comunicação com a dona do projeto
A pessoa que usa este projeto é **designer, não desenvolvedora**. Ao final de cada tarefa, explique em linguagem simples, sem jargão técnico:
1. **O que mudou visualmente.**
2. **Como ver o resultado:** um link ou um passo a passo.
3. **O que ela precisa decidir ou revisar.**

Detalhes técnicos (comandos, testes, nomes de arquivo) ficam em segundo plano: só quando forem necessários, e explicados.

## Forma de trabalhar
- Trabalhe **uma fase por vez** (PRD, seção 10). Antes de codar, apresente o plano da fase e aguarde aprovação.
- Ao terminar uma fase: rode lint, typecheck e testes; liste o que foi feito e como testar manualmente; sugira a mensagem de commit.
- Registre decisões não óbvias em `docs/DECISIONS.md` (data, decisão e motivo).
- Mudanças no banco devem ser feitas **sempre via migration** em `supabase/migrations/`. Nunca altere o schema direto no painel.
- Não instale dependências novas sem justificar.

## Regras inegociáveis
- Valores monetários são armazenados em **centavos (integer)**. Nunca use float.
- Toda tabela tem `household_id` e uma política de **RLS**. Escreva testes que provem que um usuário não acessa os dados de outra casa.
- Nunca armazene o número completo do cartão; guarde só os 4 últimos dígitos. Não registre dados financeiros em logs.
- Nunca faça commit de `.env*` nem de arquivos CSV/OFX reais. Os fixtures de teste ficam em `tests/fixtures/` e devem ser **anonimizados**.

## UI e acessibilidade
- A interface é 100% em pt-BR. A moeda é exibida como `R$ 1.234,56` e o fuso horário é `America/Sao_Paulo`.
- Design mobile-first, com áreas de toque de no mínimo 44px.
- Seguir WCAG 2.1 AA: contraste mínimo de 4.5:1, foco visível, navegação por teclado e labels em todos os campos.
- O status nunca depende só da cor: use cor, ícone e texto juntos.
- Use os componentes shadcn/ui e os tokens definidos em `app/globals.css`. Não use cores hardcoded.
- Todas as telas precisam de estados vazio, carregando e erro.

## Comandos
- `npm run dev` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run test:e2e`
- `npx supabase start` · `npx supabase db reset` · `npx supabase migration new <nome>`
