# PRD — Casita · Módulo Finanças (MVP v1)

> **Versão 1.2 (13/10/2026):** incorpora o modelo real do cartão BTG (responsabilidade por transação, acerto entre o casal, terceiros que usam o cartão) e traz a importação de **PDF** para o MVP.

> **Como usar este documento:** coloque-o na raiz do repositório (como `PRD.md` ou dentro do `CLAUDE.md`) e peça ao Claude Code para seguir as fases da seção 10, uma por vez.

---

## 0. Instruções para o agente (Claude Code)

- Você vai construir o MVP descrito abaixo **em fases incrementais** (seção 10). Conclua uma fase, rode os testes, mostre o resultado e só então avance.
- **Não invente requisitos.** Se algo não estiver especificado, escolha a opção mais simples, registre a decisão em `DECISIONS.md` e siga em frente. Pergunte antes apenas quando a decisão for difícil de reverter (por exemplo, o modelo de dados ou a autenticação).
- O código, os nomes de tabelas e as variáveis devem ficar em inglês. A interface deve ficar **100% em pt-BR**.
- Priorize, nesta ordem: corretude dos dados financeiros, depois simplicidade, depois acessibilidade e por fim estética.
- Escreva testes para a lógica crítica: parser de CSV, deduplicação, geração de recorrências, regras de categorização e cálculo de totais.

---

## 1. Contexto e problema

Somos um casal (dois usuários) que já registra os gastos do cartão de crédito numa planilha, subindo as faturas todo mês. A planilha mostra **o que já foi gasto**, mas não responde:

1. **O que ainda vai vencer** neste mês (contas fixas da casa e as datas de vencimento).
2. **Quem é responsável** por cada conta e se ela já foi paga.
3. **Para onde estamos indo**, ou seja, o progresso das nossas metas e sonhos.

Além disso, a planilha exige trabalho manual de formatação e categorização a cada fatura.

**Visão do produto:** um dashboard responsivo para gerir a casa em várias frentes (finanças, mercado, treino, rotina, pets, carro, viagens). **O MVP cobre apenas Finanças**, mas a arquitetura precisa acomodar os próximos módulos sem retrabalho.

---

## 2. Objetivos do MVP

| Objetivo | Como sabemos que funcionou |
|---|---|
| Substituir a planilha como fonte única dos gastos | Os dois últimos meses de faturas foram importados no app e a planilha deixa de ser atualizada |
| Nunca perder um vencimento | 100% das contas fixas do mês ficam com status "pago" até o vencimento |
| Reduzir o trabalho de registro | Importar e categorizar uma fatura leva **menos de 3 minutos** |
| Dar visibilidade das metas | Cada meta mostra o valor atual, o valor-alvo e o ritmo necessário |
| Uso real pelos dois | Os dois usuários acessam pelo menos uma vez por semana |

**Fora do escopo do MVP:** Open Finance e integração bancária automática, investimentos detalhados (rentabilidade, carteira), os demais módulos da casa e um app nativo (o MVP é uma web app responsiva/PWA).

> Mudança na v1.2: a leitura de fatura em **PDF** e o **acerto entre o casal** entraram no MVP, porque refletem como o casal já trabalha hoje (faturas em PDF e reembolso da parte do Thiago no cartão BTG).

---

## 3. Usuários e modelo de casa

- **Household (Casa):** a entidade que agrupa todos os dados. O MVP tem uma casa com **dois membros**.
- **Membros:** Becca e o noivo. Os dois têm permissões iguais (ambos podem ver e editar tudo).
- **Modelo de divisão (atualizado na v1.2):**
  - **Contas fixas e assinaturas:** um responsável por item, como antes.
  - **Cartões:** o cartão tem um **pagador** (quem paga a fatura; por exemplo, o BTG é debitado automaticamente na conta da Rebecca), mas **cada transação tem seu próprio responsável**. Um cartão pode ser compartilhado.
  - **Responsáveis podem ser pessoas que não usam o app.** Exemplo real: a Martha (mãe da Rebecca) usa o cartão BTG. Ela aparece como "pessoa" na casa, sem login.
  - **O acerto é opcional por cartão.** No BTG ele existe (Thiago e Martha devolvem a parte deles para a Rebecca). Em cartões de **benefício (vale-alimentação/refeição)**, o responsável é só **informativo** ("quem pagou o quê, para ter uma ideia"), sem gerar acerto.
  - Transações sem responsável definido ficam como **"A confirmar"** até alguém atribuir.
  - **Acerto:** quando a parte de alguém é paga por outra pessoa (o pagador do cartão), o app calcula quanto essa pessoa deve devolver, por competência, e registra os reembolsos (ver 4.3c).
- Onboarding: um membro cria a casa e convida o outro por e-mail (link de convite).

---

## 4. Funcionalidades (escopo v1)

### 4.1 Contas fixas e recorrentes
- Cadastro com os campos: nome, categoria, valor (fixo ou **estimado**, para contas variáveis como luz), dia de vencimento, recorrência (mensal, anual ou personalizada), responsável, forma de pagamento (opcional) e observação.
- O sistema gera **ocorrências** mensais a partir da regra de recorrência (por exemplo, "Luz — out/2026").
- Status de cada ocorrência: `a pagar`, `pago` ou `atrasado` (o status `atrasado` é calculado automaticamente após o vencimento).
- Marcar como paga: registra a data, o valor real pago e **quem marcou**.
- Contas com valor estimado: ao marcar como paga, o app pede o valor real.
- Editar uma conta fixa permite escolher entre "aplicar só a esta ocorrência" e "aplicar a esta e às próximas".

### 4.2 Lembretes de vencimento
- Lembrete padrão **3 dias antes** e **no dia do vencimento**, configurável por conta.
- O lembrete vai **apenas para o responsável** pela conta.
- Canal: notificação push (PWA) com **e-mail como alternativa** quando o push não estiver disponível (iOS exige que o app esteja instalado na tela inicial).
- Um resumo semanal opcional ("vencem esta semana: X contas, R$ Y").

### 4.3 Faturas de cartão: importação e categorização
- Cadastro de cartões com nome, banco, **pagador** (quem paga a fatura), forma de pagamento da fatura (débito automático ou manual), dia de fechamento, dia de vencimento e **apenas os 4 últimos dígitos**. Nunca armazenar o número completo.
- **Formato principal: PDF da fatura** (é o que os bancos do casal oferecem). CSV e OFX continuam aceitos como alternativa.
- **Importação de PDF (v1):**
  1. Extrair o texto do PDF. Se o PDF tiver **senha**, o app pede a senha na hora e **não a armazena**.
  2. Extrair as transações com um modelo de IA usando **saída estruturada** (data, descrição, valor, parcela, tipo: compra, crédito/estorno, tarifa/anuidade, IOF) e os dados de cabeçalho (total, vencimento, período de compras).
  3. **Conciliação obrigatória:** a soma das transações extraídas deve bater com o total da fatura (considerando créditos). Se não bater, a prévia destaca a divergência e **não permite confirmar** sem revisão manual.
  4. Prévia editável → confirmação humana → salvar. Nada é salvo sem confirmação.
  5. O PDF não fica armazenado depois da importação (guardar só os metadados do lote).
  - Se o texto do PDF for extraível e estável para um banco específico (por exemplo, o BTG), pode ser criado depois um parser determinístico para esse banco, mais barato e previsível. Esse parser é uma otimização, não um requisito do MVP.
- **Responsável por transação:** na prévia, cada transação recebe um responsável. Sugestão automática por regras aprendidas (por exemplo, "UBER → Thiago"), igual à categorização. Sem regra, fica "A confirmar".
- Tipos especiais de lançamento: **créditos/estornos** (valores negativos), **tarifas e anuidade** (mensalidade do cartão) e IOF devem aparecer separados na prévia.
- Fluxo de importação de CSV/OFX (ver fluxo 5.2), com suporte a **arquivos em Windows-1252 (Latin-1) e separador ponto e vírgula**, comuns em exportações brasileiras:
  - O usuário escolhe o cartão e o mês de referência da fatura.
  - **Mapeamento de colunas** (data, descrição, valor, parcela). O mapeamento fica **salvo por cartão**, para que as próximas importações sejam em um clique.
  - Prévia antes de confirmar, com categoria sugerida e alertas de duplicidade.
  - **Deduplicação** por data, valor e descrição normalizada, dentro do mesmo cartão.
  - Detecção de compras parceladas ("3/10") e de estornos (valores negativos).
- Categorização:
  - Categorias padrão editáveis: Moradia, Mercado, Alimentação fora, Transporte/Carro, Saúde, Pets, Lazer, Viagens, Assinaturas, Compras, Educação e Outros.
  - **Regras automáticas aprendidas:** quando o usuário corrige a categoria de um estabelecimento, o app oferece a opção "sempre categorizar [ESTABELECIMENTO] como [CATEGORIA]".
  - Edição em massa na prévia (selecionar várias e trocar a categoria).
- A fatura importada aparece como uma **despesa a vencer** na visão do mês, com o valor total, o vencimento do cartão e o responsável (o titular).

### 4.3b Assinaturas (prioridade alta)
Assinaturas são uma **entidade própria**, separada das contas fixas, porque costumam ser cobradas no cartão.
- Campos: nome, valor, ciclo (mensal ou anual), próxima cobrança, **cartão vinculado** (ou "débito/boleto"), responsável, categoria, data de fim do teste grátis (opcional) e status (ativa, em teste, cancelada).
- **Sem dupla contagem:** uma assinatura vinculada a um cartão gera *previsão* de gasto, mas não um pagamento separado. Quando a fatura é importada, a transação correspondente é **conciliada** com a assinatura (match por estabelecimento e valor aproximado).
- **Detecção automática:** depois de cada importação, o app identifica cobranças recorrentes (mesmo estabelecimento normalizado, variação de valor ≤ 10%, intervalo de cerca de 30 ou cerca de 365 dias) e sugere: "Isso parece uma assinatura. Quer acompanhar?". O app só cria a assinatura depois da confirmação do usuário.
- **Alertas:** aumento de preço detectado na conciliação ("Spotify subiu de R$ X para R$ Y"), cobrança esperada que não apareceu na fatura e fim do teste grátis (D-3).
- **Tela de assinaturas:** custo total mensal e anualizado, lista ordenada por próxima cobrança, filtros por responsável e por cartão.

### 4.3c Acerto entre o casal
- Para cada fatura, o app calcula a **parte de cada responsável**. Quando o pagador do cartão é diferente do responsável, essa parte vira um **valor a acertar** (por exemplo, a parte do Thiago numa fatura que é debitada da conta da Rebecca).
- Visão de acerto por competência: parte devida, valor devolvido, saldo e status (pendente, parcial, quitado).
- Registrar reembolso: valor, data, quem pagou a quem, **forma** (Pix/transferência, dinheiro ou **resgate de investimento**) e observação. A parte da Martha costuma ser quitada com um resgate da parte dela num investimento compartilhado, feito pela Rebecca. Um reembolso pode quitar várias competências (o mais antigo primeiro, com possibilidade de escolher).
- Saldo total em aberto em destaque ("Thiago → Rebecca: R$ X em aberto").
- Transações "A confirmar" ficam fora do cálculo até serem atribuídas, e o app avisa quando isso acontece ("R$ X ainda sem responsável nesta fatura").

### 4.4 Metas e sonhos
- Campos: nome, valor-alvo, data-alvo (opcional), imagem ou emoji (opcional), responsável ou "conjunta".
- Aportes registrados manualmente (valor, data e quem aportou).
- Para cada meta, mostrar o valor atual, o percentual concluído e o **ritmo necessário** ("faltam R$ X, ou seja, R$ Y/mês até [data]").
- Estados: ativa, pausada, concluída.

### 4.5 Visão do mês (Home)
Ordem de prioridade dos blocos:
1. **Contas e assinaturas do mês:** uma lista única em ordem cronológica com contas fixas, faturas de cartão e assinaturas (as assinaturas no cartão vêm marcadas como "no cartão X"). Os itens atrasados ficam no topo, com ação rápida de "marcar como pago".
2. **Resumo do mês:** total pago, total a vencer e total atrasado, além do **total comprometido com assinaturas** (mensal).
3. **Gastos por categoria** no mês (barras horizontais, mais legíveis do que um gráfico de pizza).
4. **Por responsável:** quanto cada pessoa gastou no mês (incluindo terceiros como familiares) e o **saldo de acerto em aberto** entre o casal.
5. **Metas:** cards com o progresso.

Sugestões pendentes (por exemplo, "3 possíveis assinaturas detectadas") aparecem como um aviso discreto no topo, que pode ser dispensado.

Seletor de mês para navegar pelo histórico.

---

## 5. Fluxos principais

### 5.1 Primeiro acesso
Login → criar casa → convidar parceiro(a) → cadastrar cartões → cadastrar contas fixas (com sugestões comuns: aluguel, condomínio, luz, água, internet, gás, celular, streaming, seguro do carro, IPVA) → importar a primeira fatura → Home.
- Cada etapa pode ser pulada e tem um estado vazio que explica o próximo passo.

### 5.2 Importar fatura
Upload do arquivo (**PDF da fatura**, ou CSV/OFX quando disponível; sem conversão manual) → (se tiver senha) informar a senha do PDF → selecionar cartão e mês de referência → (só na primeira vez) mapear colunas → prévia com categorias sugeridas e duplicadas marcadas → ajustar → confirmar → resumo ("42 transações importadas, 3 duplicadas ignoradas, total R$ X").
- Erros de parsing devem dizer **qual linha** falhou e por quê. O app não deve falhar silenciosamente.
- A importação inteira pode ser desfeita (excluir lote).
- Depois de confirmar: conciliação com as assinaturas existentes e sugestão de novas assinaturas detectadas.
- **PDF (v1):** a prévia mostra o total extraído ao lado da soma das transações, com um indicador claro de "confere" ou "não confere". Também mostra quanto ficou "A confirmar" por responsável.
- Feedback de progresso durante a extração (que pode levar alguns segundos): etapas visíveis ("Lendo o PDF", "Identificando transações", "Conferindo o total") e possibilidade de cancelar.

### 5.2c Registrar um acerto
Home ou tela de Acertos → "Registrar reembolso" → valor, data, de quem para quem → o app mostra quais competências serão quitadas → confirmar.

### 5.2b Gerenciar assinaturas
Sugestão detectada → confirmar (os dados vêm pré-preenchidos) ou descartar ("não é assinatura", para não sugerir de novo). Cadastro manual também está disponível. Cancelar uma assinatura a marca como `cancelada`, e o app avisa se a cobrança continuar aparecendo nas faturas.

### 5.3 Pagar conta
Lembrete → abrir o app → card da conta → "Marcar como paga" → confirmar o valor e a data (preenchidos por padrão com o valor previsto e a data de hoje) → status atualizado para os dois usuários.

### 5.4 Aportar em meta
Card da meta → "Adicionar aporte" → valor → progresso atualizado.

---

## 6. Modelo de dados (proposta)

```
households(id, name, created_at)
members(id, household_id, user_id, display_name, role)
categories(id, household_id, name, icon, color, is_default)
people(id, household_id, member_id null, display_name)   -- inclui quem não usa o app
cards(id, household_id, payer_person_id, name, bank, last4, kind (credit|benefit),
      generates_settlement bool, closing_day, due_day, bill_payment_method, csv_mapping jsonb)
statements(id, card_id, reference_month, due_date, purchase_period_start, purchase_period_end,
           total_amount, credits_amount, import_batch_id, source_format, reconciled bool, status)
transactions(id, household_id, card_id, statement_id, date, description_raw, description_normalized,
             amount, kind, installment_current, installment_total, category_id,
             responsible_person_id null=a confirmar, import_batch_id, dedupe_hash)
responsibility_rules(id, household_id, match_pattern, person_id, created_by)
settlements(id, household_id, from_person_id, to_person_id, amount, paid_at,
            method (pix|cash|investment_withdrawal|other), note, created_by)
settlement_allocations(id, settlement_id, statement_id, amount)
category_rules(id, household_id, match_pattern, category_id, created_by)
import_batches(id, household_id, card_id, file_name, created_by, created_at, rows_imported, rows_skipped)
bills(id, household_id, name, category_id, owner_member_id, amount, is_estimated,
      due_day, recurrence_rule, reminder_offsets int[], active)
bill_occurrences(id, bill_id, due_date, expected_amount, paid_amount, paid_at, paid_by_member_id, status)
subscriptions(id, household_id, name, merchant_pattern, amount, billing_cycle, next_charge_date,
              card_id null=débito/boleto, owner_member_id, category_id, trial_ends_at, status)
subscription_charges(id, subscription_id, transaction_id, charged_at, amount)  -- conciliação
dismissed_subscription_suggestions(id, household_id, merchant_pattern)
goals(id, household_id, name, target_amount, target_date, owner_member_id null=conjunta, icon, status)
goal_contributions(id, goal_id, member_id, amount, date)
notification_settings(member_id, push_enabled, email_enabled, weekly_digest)
```

- Valores monetários armazenados em **centavos (integer)**. Nunca usar float.
- Todas as tabelas têm `household_id` e políticas de **Row Level Security**: um usuário só acessa os dados da própria casa.
- Fuso horário: `America/Sao_Paulo`. A moeda é BRL, formatada como `R$ 1.234,56`.

---

## 7. Stack sugerida

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**
- **Supabase**: Postgres, Auth (magic link ou Google), RLS, Edge Functions + cron para gerar ocorrências e disparar lembretes
- **PWA** (manifest + service worker) para instalação no celular e Web Push; Resend (ou similar) para e-mail
- Deploy na **Vercel**
- Testes: Vitest para a lógica e Playwright para os fluxos críticos (importação e marcar como pago)

Se o agente identificar uma alternativa mais simples com o mesmo resultado, ele deve propô-la antes de começar a Fase 1.

---

## 8. Arquitetura modular (preparando o futuro)

- A navegação deve ser organizada por **módulos**: Finanças agora; Mercado, Treino, Rotina, Pets, Carro e Viagens depois.
- No MVP, **não exibir módulos vazios** ("em breve"). A estrutura de rotas (`/financas/...`) e o layout já devem suportar novos itens no menu.
- Categorias como Pets, Carro e Viagens já existem em Finanças e, no futuro, vão se conectar aos módulos correspondentes (por exemplo, gastos do carro dentro do módulo Carro).
- Componentes compartilhados (cards, listas com status, seletor de responsável, seletor de mês) devem ser genéricos e reutilizáveis.

---

## 9. Requisitos de UX, acessibilidade e qualidade

**Responsividade (mobile-first)**
- No celular, usar navegação inferior com até 5 itens. No desktop, usar sidebar.
- Ações principais acessíveis com o polegar. Áreas de toque de no mínimo 44×44px.
- Tabelas de transações viram lista de cards no mobile.

**Acessibilidade (WCAG 2.1 AA)**
- Contraste mínimo de 4.5:1 para texto e 3:1 para componentes de interface.
- **O status nunca deve depender só da cor**: "atrasado" combina cor, ícone e texto.
- Navegação completa por teclado, com foco visível.
- Gráficos com alternativa textual (tabela ou resumo lido pelo leitor de tela).
- Labels explícitos em todos os campos. Erros de formulário descritos em texto e associados ao campo (`aria-describedby`).
- Respeitar `prefers-reduced-motion` e oferecer modo escuro.

**Feedback e confiança nos dados**
- Toda ação destrutiva pede confirmação e oferece desfazer quando possível.
- O histórico mostra **quem fez o quê** (quem marcou como pago, quem importou, quem editou).
- Estados vazios, de carregamento e de erro precisam ser desenhados para todas as telas.
- Valores monetários usam fonte tabular (`tabular-nums`) para alinhar os números.

**Segurança e privacidade**
- Dados financeiros: RLS obrigatória, nenhum dado sensível em logs, e apenas os 4 últimos dígitos dos cartões.
- Os arquivos CSV e PDF são processados e **não ficam armazenados** após a importação (guardar apenas os metadados do lote). Senhas de PDF nunca são armazenadas nem registradas em log.
- **Extração por IA:** o conteúdo da fatura é enviado para a API do modelo de IA. A chave da API fica só no servidor (nunca no navegador), e a política de uso de dados do provedor deve ser verificada e registrada em `docs/DECISIONS.md`.

---

## 10. Plano de entrega por fases

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 0 | Fundação: projeto, design system Casita, layout responsivo | Página /design-system aprovada |
| 1 | Casa, membros e pessoas: login, criar casa, convite, pessoas sem login, RLS | Segundo usuário entra pelo convite e vê os mesmos dados; testes de RLS passando |
| 2 | Contas fixas e ocorrências: CRUD, recorrência, marcar como pago | Ocorrências do mês corretas; status `atrasado` automático |
| 3 | Cartões e importação de fatura (PDF + CSV/OFX): extração, conciliação do total, prévia, deduplicação, desfazer | A fatura de set/2026 do BTG importa com o total conferindo; importar duas vezes não duplica |
| 4 | Responsáveis e acerto: responsável por transação, regras aprendidas, "A confirmar", acerto por competência, reembolsos | A divisão de set/2026 bate com a planilha atual; saldo de acerto correto |
| 5 | Categorização: categorias padrão, regras aprendidas, edição em massa | Segunda importação do mesmo cartão vem com 70% ou mais já categorizado |
| 6 | Assinaturas: cadastro, conciliação com faturas, detecção, alertas | Nenhuma assinatura no cartão é contada duas vezes |
| 7 | Home / visão do mês com dados reais | Todos os blocos da seção 4.5 com dados reais e estados vazios |
| 8 | Lembretes: push e e-mail, configuração por conta | Lembrete chega só ao responsável, D-3 e D-0 |
| 9 | Metas e aportes | Ritmo necessário calculado corretamente |
| 10 | Migração do histórico, revisão de acessibilidade e deploy | Histórico de jun–set/2026 importado; Lighthouse acessibilidade ≥ 95; app instalável no celular |

---

## 11. Métricas de sucesso (uso pessoal)

- **Contas pagas em dia:** meta de 100%.
- **Tempo de importação de uma fatura:** menos de 3 minutos.
- **Taxa de categorização automática:** 70% ou mais a partir do segundo mês.
- **Uso pelos dois:** ambos ativos semanalmente.
- **Abandono da planilha:** a planilha não é mais atualizada depois de 2 meses de uso.

---

## 12. Pontos em aberto

- [x] ~~Gastos compartilhados no cartão~~ → resolvido na v1.2: responsável por transação.
- [x] ~~PDF na v1?~~ → sim, os bancos do casal são focados em PDF.
- [ ] Os PDFs das faturas têm senha? Precisamos de um PDF de cada banco para os testes (mantido fora do Git).
- [x] ~~Compras de uso comum~~ → sem regra de divisão. Mercado é pago no vale e o registro de quem pagou é só informativo.
- [ ] Os vales têm extrato em PDF ou CSV? Se não tiverem, o lançamento no vale pode ser manual e rápido, ou ficar para o módulo Mercado.
- [ ] Quais bancos e cartões vamos importar? Precisamos de **um CSV de exemplo de cada** para criar os testes do parser.
- [ ] Registrar renda no MVP para mostrar o saldo do mês, ou deixar para a v2?
- [ ] Importar o histórico da planilha atual (migração única) ou começar do zero?

### Backlog v2 (fora do MVP)
- **Reservas por pessoa:** acompanhar o saldo da parte da Martha no investimento compartilhado, descontando automaticamente os resgates usados para quitar a parte dela no cartão.
- Conexão com o sistema de compras do mês que o casal já usa no Notion (módulo Mercado).
