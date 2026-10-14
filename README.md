# Casita

App web responsivo (PWA) para um casal gerenciar a casa. O MVP cobre o módulo **Finanças**.

- Especificação: [`docs/PRD.md`](docs/PRD.md) · Roteiro: [`docs/ROTEIRO.md`](docs/ROTEIRO.md)
- Instruções do projeto: [`CLAUDE.md`](CLAUDE.md) · Decisões: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Tokens e componentes: rode o app e abra `/design-system`

## Rodar no computador

Requer Node 22+ e Docker (para o Supabase local).

```bash
npm install
npx supabase start          # sobe Postgres + Auth locais e aplica as migrations
cp .env.example .env.local  # cole a "API URL" e a "anon key" que o comando acima mostrou
npm run dev                 # http://localhost:3000
```

Os e-mails de login do Supabase local aparecem no Mailpit: http://127.0.0.1:54324

Sem `.env.local`, o app abre em **modo demonstração** (dados fictícios, sem login).

## Verificações

```bash
npm run lint
npm run typecheck
npm test          # lógica e componentes (inclui o contraste WCAG dos tokens)
npm run test:db   # migrations e RLS no Postgres do Supabase local
npm run build
```
