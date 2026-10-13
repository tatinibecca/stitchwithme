# Casita — Roteiro das fases 2 a 10

Guia prático para seguir depois da Fase 1, com o prompt de cada fase, como validar o resultado e o que merece atenção.
Ele acompanha o **PRD v1.2** (`docs/PRD.md`). Substitua o PRD antigo do repositório pela versão nova antes de começar.

---

## Antes de tudo: o ritual de cada fase

Repita estes passos em todas as fases:

1. **`/clear`** no Claude Code, para começar a fase com o contexto limpo.
2. **Plan mode** (`Shift+Tab`) e cole o prompt da fase.
3. **Revise o plano.** Se ele mexer no banco (tabelas, RLS), leia com calma ou peça: *"me explique em linguagem simples o que essa mudança no banco faz"*.
4. Saia do plan mode e mande implementar.
5. **Valide** usando o checklist da fase (seção "Como validar").
6. Peça o commit: *"faça o commit com uma mensagem descritiva e o push"*.

Se algo der errado no meio, diga exatamente o que você viu: *"cliquei em X e apareceu Y, eu esperava Z"*. É o mesmo princípio de um bom relato de bug.

---

## Preparação: arquivos reais (faça uma vez)

Seus arquivos reais (a planilha em CSV e os PDFs das faturas) **nunca devem ir para o Git**, mesmo num repositório privado. Eles ficam numa pasta local ignorada.

```
Crie a pasta private/ na raiz e adicione private/ ao .gitignore.
Confirme rodando git check-ignore que a pasta está ignorada.
Depois me diga onde devo colocar os arquivos reais.
```

Coloque nessa pasta:
- `private/planilha/Controle_Financeiro_BTG_RESUMO.csv` (o arquivo que você já tem)
- `private/faturas/` com os PDFs das faturas de jun, ago e set/2026 do BTG e de outros cartões

**O que o CSV da planilha é (e o que não é):** ele é a **aba de resumo** da planilha, não um extrato com as transações. Por isso ele não serve para testar a importação, mas serve muito bem como **gabarito**: depois de importar o PDF de set/2026, os números do app precisam bater com os da planilha (total da fatura e parte de cada pessoa). Se você tiver a aba de lançamentos (cada compra com o responsável), exporte também. Ela é o que vai permitir migrar o histórico na Fase 10.

---

## Fase 2 — Contas fixas e ocorrências

**Objetivo:** cadastrar as contas da casa e ver o que vence no mês.

```
Fase 2 do PRD (seções 4.1 e 5.3). Leia o PRD antes.

1. Migrations de bills e bill_occurrences com RLS, valores em centavos.
2. Lógica de recorrência (mensal, anual) e geração das ocorrências do
   mês, com status atrasado calculado automaticamente após o
   vencimento (fuso America/Sao_Paulo). Escreva os testes ANTES da UI,
   incluindo: vencimento no dia 31 em mês de 30 dias, fevereiro,
   conta anual e edição "só esta" vs "esta e as próximas".
3. Telas: lista de contas do mês (agrupada por status), cadastro e
   edição, e a ação "Marcar como paga" (valor e data pré-preenchidos;
   conta estimada pede o valor real).
4. Ao cadastrar, ofereça sugestões comuns (aluguel, condomínio, luz,
   água, internet, gás, celular, seguro do carro, IPVA).

Siga o design system Casita. Estados vazio, carregando e erro.
Ao final, me mostre o preview e explique em linguagem simples.
```

**Como validar**
- Cadastre 3 contas reais da casa e confira se as datas do mês estão certas.
- Mude a data do computador (ou peça para o Claude simular) e veja se uma conta vira "atrasada".
- Marque uma como paga pelo celular e veja se o status aparece atualizado na sessão do Thiago.

---

## Fase 3 — Cartões e importação de fatura (PDF + CSV/OFX)

**Objetivo:** subir a fatura em PDF e ver as transações conferidas com o total. É a fase mais crítica do app.

```
Fase 3 do PRD (seções 4.3 e 5.2, versão 1.2). Leia o PRD antes.

Use os PDFs em private/faturas/ apenas localmente: NUNCA copie
conteúdo real para tests/, commits ou logs.

1. Migrations de cards, statements, transactions e import_batches.
2. Extração de PDF:
   - extrair o texto do PDF no servidor; se houver senha, pedir ao
     usuário e nunca armazenar nem registrar em log
   - extrair transações e cabeçalho (total, créditos, vencimento,
     período) com a API da Anthropic usando saída estruturada
     validada por schema (zod). Chave da API só no servidor (.env)
   - classificar cada lançamento: compra, crédito/estorno,
     tarifa/anuidade, IOF; detectar parcelas ("3/10")
   - conciliação: soma das transações vs total da fatura; se não
     bater, bloquear a confirmação e destacar a divergência
3. Importação CSV/OFX como alternativa, com suporte a Windows-1252
   e separador ponto e vírgula, e mapeamento de colunas salvo por
   cartão.
4. Prévia editável, deduplicação, confirmação, resumo e "desfazer
   importação" (excluir o lote).
5. Feedback de progresso durante a extração, com etapas visíveis e
   opção de cancelar.
6. Testes: crie fixtures FICTÍCIAS em tests/fixtures/ (um texto de
   fatura inventado e um CSV inventado), nunca dados reais.

Antes de implementar a extração, rode um teste com UM PDF real em
private/faturas/ e me mostre só o resumo (quantidade de transações,
total extraído vs total da fatura), sem listar as transações.

Registre em docs/DECISIONS.md a política de uso de dados da API.
Ao final, me mostre o preview e explique em linguagem simples.
```

**Como validar**
- Importe a fatura de **set/2026 do BTG**. O total precisa conferir com o da planilha.
- Importe o mesmo PDF de novo: nada pode ser duplicado.
- Teste o "desfazer importação".
- Abra a prévia no celular: a lista de transações precisa ser legível e editável com o polegar.

**Atenção**
- A extração por IA envia o conteúdo da fatura para a API. Isso é um trade-off de privacidade: confira a política do provedor e decida conscientemente.
- A API tem custo por uso, normalmente pequeno por fatura. Peça ao Claude Code para mostrar o custo estimado de cada importação nos logs de desenvolvimento.
- Se o BTG tiver um PDF de texto bem estruturado, vale pedir depois um parser específico para ele (sem IA): mais barato e 100% previsível.

---

## Fase 4 — Responsáveis e acerto

**Objetivo:** dizer de quem é cada compra e saber quanto o Thiago deve devolver. Hoje isso está na planilha.

```
Fase 4 do PRD (seções 3, 4.3 e 4.3c, versão 1.2). Leia o PRD antes.

1. Migrations de people (inclui pessoas sem login), responsibility_rules,
   settlements e settlement_allocations. Responsável em transactions.
2. Na prévia de importação e na lista de transações: atribuir
   responsável por transação, com edição em massa. Regras aprendidas:
   ao atribuir um estabelecimento, oferecer "sempre atribuir [X] a
   [pessoa]". Sem regra: "A confirmar".
3. Cálculo por fatura: parte de cada pessoa; quando o pagador do
   cartão é diferente do responsável, gerar valor a acertar.
   Testes ANTES da UI, incluindo créditos/estornos, anuidade e
   transações "A confirmar" (ficam fora do cálculo, com aviso).
4. Tela de Acertos: por competência (devido, devolvido, saldo,
   status) e saldo total em aberto em destaque. Registrar reembolso,
   alocando nas competências mais antigas primeiro, com a forma do
   pagamento (Pix, dinheiro ou resgate de investimento).
5. Cadastro de pessoas da casa sem login (a Martha, minha mãe, usa
   o cartão BTG e devolve a parte dela via resgate de investimento).
6. Cartões têm tipo (crédito ou benefício/vale) e a opção "gera
   acerto". No vale, o responsável é só informativo, sem acerto.

Ao final, compare com private/planilha/: a divisão de set/2026 por
pessoa deve bater com a planilha. Mostre só o comparativo de totais.
Explique em linguagem simples.
```

**Como validar**
- A divisão de set/2026 por pessoa bate com a planilha.
- Registre um reembolso de teste e veja o saldo diminuir na competência certa.
- Confira que a parte da Martha aparece separada da do Thiago, cada uma com o seu saldo.
- Importe a próxima fatura e veja quantas transações já vêm com o responsável sugerido.

---

## Fase 5 — Categorização

```
Fase 5 do PRD (seção 4.3, categorização). Leia o PRD antes.
Categorias padrão editáveis, regras aprendidas por estabelecimento
("sempre categorizar X como Y"), edição em massa na prévia e na
lista. Reaproveite o mesmo mecanismo de regras da Fase 4 (responsável)
para não duplicar lógica. Testes das regras antes da UI.
Ao final, me mostre o preview e explique em linguagem simples.
```

**Como validar:** depois de categorizar uma fatura inteira, importe outra do mesmo cartão. A meta é que **70% ou mais** já venham categorizadas.

---

## Fase 6 — Assinaturas

```
Fase 6 do PRD (seções 4.3b e 5.2b). Leia o PRD antes.
Cadastro de assinaturas vinculadas a cartão (sem dupla contagem),
conciliação com as transações importadas, detecção de cobranças
recorrentes com sugestão "Isso parece uma assinatura?", alertas de
aumento de preço, de cobrança ausente e de fim de teste grátis.
Tela de assinaturas com total mensal e anualizado. Testes da
detecção e da conciliação antes da UI.
Rode a detecção nas faturas já importadas e me mostre as sugestões.
Ao final, me mostre o preview e explique em linguagem simples.
```

**Como validar:** confira se as assinaturas sugeridas são de fato assinaturas, e se o total mensal não conta duas vezes o que já está na fatura.

---

## Fase 7 — Home com dados reais

Se você já fez a Home com dados fictícios no Claude Design, esta fase troca os mocks pelos dados reais.

```
Fase 7 do PRD (seção 4.5). Leia o PRD antes.
Conecte a Home aos dados reais, mantendo o layout aprovado.
Blocos na ordem do PRD: contas e assinaturas do mês (atrasados no
topo, ação rápida de marcar como pago), resumo do mês, gastos por
categoria, por pessoa com saldo de acerto, metas. Seletor de mês.
Use o mascote só nos estados vazio e "tudo pago", nunca em atraso.
Ao final, me mostre o preview e explique em linguagem simples.
```

**Como validar (teste com o Thiago):** sem explicar nada, peça para ele abrir no celular e responder: *"O que vence esta semana?"* e *"Quanto você precisa devolver?"*. Se ele hesitar, é um problema de hierarquia para corrigir.

---

## Fase 8 — Lembretes

```
Fase 8 do PRD (seção 4.2). Leia o PRD antes.
Lembretes D-3 e D-0 só para o responsável, push (PWA) com e-mail
como alternativa, configuração por conta e resumo semanal opcional.
Inclua lembrete mensal de acerto pendente ("R$ X em aberto").
Explique em linguagem simples como ativar as notificações no iPhone
(precisa instalar o app na tela inicial) e no Android.
```

**Como validar:** crie uma conta que vence em 3 dias e veja se o lembrete chega só no celular do responsável.

---

## Fase 9 — Metas e sonhos

```
Fase 9 do PRD (seção 4.4). Leia o PRD antes.
Metas com valor-alvo, data opcional, responsável ou conjunta,
aportes manuais e cálculo do ritmo necessário. Use o mascote
"celebrando" quando uma meta for concluída.
Ao final, me mostre o preview e explique em linguagem simples.
```

---

## Fase 10 — Histórico, acessibilidade e deploy

```
Fase 10 do PRD.
1. Migração: importe os PDFs de jun, ago e set/2026 e compare com
   private/planilha/ (totais e parte de cada pessoa). Registre os
   acertos já devolvidos conforme eu informar.
2. Revisão de acessibilidade WCAG 2.1 AA de todas as telas:
   contraste, teclado, leitor de tela, foco, labels e
   prefers-reduced-motion. Rode Lighthouse e axe e corrija.
3. Deploy: Supabase de produção (migrations), Vercel com variáveis
   de ambiente e teste de instalação como PWA.
Me dê o link final e um passo a passo simples para eu e o Thiago
instalarmos no celular.
```

**Como validar:** instalem no celular de vocês dois, usem por duas semanas e anotem tudo que incomodar. Essa lista vira o backlog da v2.

---

## Métricas para acompanhar depois do lançamento

| Métrica | Meta |
|---|---|
| Contas pagas em dia | 100% |
| Tempo para importar uma fatura em PDF | menos de 3 minutos |
| Faturas importadas com o total conferindo de primeira | 90% ou mais |
| Transações com responsável sugerido automaticamente | 70% ou mais a partir do 2º mês |
| Planilha deixou de ser usada | depois de 2 meses |
