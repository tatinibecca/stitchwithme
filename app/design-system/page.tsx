import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, Home, LoaderCircle, Plus, Receipt, Tv, Wifi, Zap } from "lucide-react";
import { Logo } from "@/components/app-shell/logo";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/states";
import { List, ListRow } from "@/components/list-row";
import { TextField } from "@/components/text-field";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRatio } from "@/lib/contrast";
import { formatDueDate } from "@/lib/format";
import { evaluateContrast } from "@/lib/tokens";
import { loadThemeTokens } from "@/lib/tokens-server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "cores", label: "Cores" },
  { id: "contraste", label: "Contraste" },
  { id: "tipografia", label: "Tipografia" },
  { id: "espacamento", label: "Espaçamento" },
  { id: "raios", label: "Raios" },
  { id: "elevacao", label: "Elevação" },
  { id: "componentes", label: "Componentes" },
];

const COLOR_GROUPS: { title: string; tokens: { name: string; usage: string }[] }[] = [
  {
    title: "Superfícies",
    tokens: [
      { name: "background", usage: "Fundo da página" },
      { name: "surface", usage: "Faixas, hover, campos desabilitados" },
      { name: "card", usage: "Fundo de cards" },
    ],
  },
  {
    title: "Texto",
    tokens: [
      { name: "foreground", usage: "Texto principal, anel de foco no claro" },
      { name: "foreground-secondary", usage: "Descrições e metadados" },
      { name: "neutral", usage: "Ícones e rótulos — só sobre background" },
    ],
  },
  {
    title: "Marca",
    tokens: [
      { name: "primary", usage: "Só o CTA principal" },
      { name: "primary-hover", usage: "Hover do CTA (clareia)" },
      { name: "primary-foreground", usage: "Rótulo sobre o coral" },
      { name: "brand-teal", usage: "Destaques/ícones — nunca texto" },
    ],
  },
  {
    title: "Linhas e foco",
    tokens: [
      { name: "border", usage: "Divisores decorativos" },
      { name: "input", usage: "Borda de campos (≥ 3:1)" },
      { name: "ring", usage: "Anel de foco" },
      { name: "destructive", usage: "Erros de formulário" },
    ],
  },
  {
    title: "Status",
    tokens: [
      { name: "status-paid-fg", usage: "Pago — texto e ícone" },
      { name: "status-paid-bg", usage: "Pago — fundo" },
      { name: "status-due-fg", usage: "A vencer — texto e ícone" },
      { name: "status-due-bg", usage: "A vencer — fundo" },
      { name: "status-overdue-fg", usage: "Atrasado — texto e ícone" },
      { name: "status-overdue-bg", usage: "Atrasado — fundo" },
      { name: "status-info-fg", usage: "Info — texto e ícone" },
      { name: "status-info-bg", usage: "Info — fundo" },
    ],
  },
];

const TYPE_SCALE = [
  { cls: "font-display text-hero-title", name: "hero-title", spec: "Nunito Sans 48/56 · 800", sample: "Outubro de 2026" },
  { cls: "font-display text-section-title", name: "section-title", spec: "Nunito Sans 32/40 · 700", sample: "Contas do mês" },
  { cls: "font-display text-card-title", name: "card-title", spec: "Nunito Sans 22/28 · 700", sample: "Viagem para Lisboa" },
  { cls: "text-subtitle", name: "subtitle", spec: "DM Sans 18/24 · 600", sample: "Vencem esta semana" },
  { cls: "text-body-large", name: "body-large", spec: "DM Sans 16/24 · 400", sample: "A fatura do cartão fecha no dia 5." },
  { cls: "text-body", name: "body", spec: "DM Sans 14/20 · 400", sample: "Marcado como pago por Becca." },
  { cls: "text-body-small", name: "body-small", spec: "DM Sans 12/16 · 400", sample: "Valores em reais, fuso de Brasília." },
  { cls: "label-caps", name: "label", spec: "DM Sans 12/16 · 600 · caixa alta", sample: "Vencimento" },
  { cls: "font-mono text-code", name: "code", spec: "JetBrains Mono 14/20 · 400", sample: "lote_id: 2026-10-a1f3" },
];

const SPACING = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20];

const RADII = [
  { cls: "rounded-xs", name: "xs · 4px", usage: "Badges, checkbox" },
  { cls: "rounded-sm", name: "sm · 8px", usage: "Botões, campos, cards simples" },
  { cls: "rounded-md", name: "md · 12px", usage: "Cards, modais" },
  { cls: "rounded-lg", name: "lg · 16px", usage: "Painéis, bottom sheets" },
  { cls: "rounded-pill", name: "pill", usage: "Chips, avatares, toggle" },
];

const ELEVATIONS = [
  { cls: "shadow-elevation-1", name: "elevation-1", usage: "Cards em repouso" },
  { cls: "shadow-elevation-2", name: "elevation-2", usage: "Hover, menus, tooltips" },
  { cls: "shadow-elevation-3", name: "elevation-3", usage: "Barras fixas, overlays" },
];

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 border-t pt-12">
      <h2 id={`${id}-titulo`} className="text-card-title md:text-section-title">
        {title}
      </h2>
      {description && <p className="mt-2 max-w-2xl text-body-large text-muted-foreground">{description}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Subheading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-subtitle">{children}</h3>;
}

export default function DesignSystemPage() {
  const themes = loadThemeTokens();
  const results = evaluateContrast(themes);
  const failures = results.filter((r) => !r.passes).length;

  return (
    <div className="mx-auto max-w-page px-6 pb-20 md:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="no-underline">
            <Link href="/financas" aria-label="Voltar para o app">
              <ArrowLeft />
            </Link>
          </Button>
          <Logo />
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-4 py-8">
        <p className="label-caps text-muted-foreground">Fase 0 · base visual</p>
        <h1 className="text-section-title md:text-hero-title">Design system</h1>
        <p className="max-w-2xl text-body-large text-muted-foreground">
          Tokens e componentes base do Stitchwithme, derivados do design system Coral Stay e ajustados para WCAG 2.1
          AA. Troque o tema acima para conferir o modo escuro.
        </p>
        <nav aria-label="Seções do design system" className="pt-2">
          <ul role="list" className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-11 items-center rounded-pill border border-input px-4 text-body font-medium hover:bg-surface"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-12">
        {/* Cores */}
        <Section id="cores" title="Cores" description="Cada amostra usa a variável CSS do tema atual. Os hex mostram os valores do tema claro e do escuro.">
          <div className="flex flex-col gap-10">
            {COLOR_GROUPS.map((group) => (
              <div key={group.title}>
                <Subheading>{group.title}</Subheading>
                <ul role="list" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {group.tokens.map((t) => (
                    <li key={t.name} className="flex items-center gap-4 rounded-md border bg-card p-4">
                      <span
                        aria-hidden="true"
                        className="size-12 shrink-0 rounded-sm border border-input"
                        style={{ background: `var(--${t.name})` }}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-mono text-code">--{t.name}</p>
                        <p className="text-body-small text-muted-foreground">{t.usage}</p>
                        <p className="tabular font-mono text-body-small text-muted-foreground">
                          {themes.light[t.name]} · {themes.dark[t.name]}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Contraste */}
        <Section
          id="contraste"
          title="Contraste"
          description="Calculado a partir de app/globals.css. O mesmo cálculo roda no teste lib/tokens.test.ts e quebra o build se algum par cair abaixo do mínimo."
        >
          <div className="mb-6">
            {failures === 0 ? (
              <StatusBadge status="paid" label={`${results.length} pares verificados — todos passam no AA`} />
            ) : (
              <StatusBadge status="overdue" label={`${failures} de ${results.length} pares abaixo do AA`} />
            )}
          </div>
          <div className="overflow-x-auto rounded-md border" tabIndex={0} role="region" aria-labelledby="tabela-contraste">
            <table className="w-full min-w-[720px] border-collapse text-left text-body">
              <caption id="tabela-contraste" className="sr-only">
                Razão de contraste de cada par texto/fundo, nos temas claro e escuro
              </caption>
              <thead className="bg-surface">
                <tr>
                  {["Amostra", "Uso", "Texto / fundo", "Tema", "Razão", "Mínimo", "Resultado"].map((h) => (
                    <th key={h} scope="col" className="label-caps px-4 py-3 text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={`${r.theme}-${r.fg}-${r.bg}`} className="border-t">
                    <td className="px-4 py-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-flex h-8 w-12 items-center justify-center rounded-xs font-semibold",
                          r.kind === "ui" && "border-2",
                        )}
                        style={{ background: r.bgHex, color: r.fgHex, borderColor: r.kind === "ui" ? r.fgHex : undefined }}
                      >
                        {r.kind === "text" ? "Aa" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.usage}</td>
                    <td className="px-4 py-3 font-mono text-body-small">
                      {r.fg} / {r.bg}
                    </td>
                    <td className="px-4 py-3">{r.theme === "light" ? "Claro" : "Escuro"}</td>
                    <th scope="row" className="tabular px-4 py-3 font-semibold">
                      {formatRatio(r.ratio)}
                    </th>
                    <td className="tabular px-4 py-3 text-muted-foreground">
                      {r.min}:1 {r.kind === "ui" ? "(UI)" : "(texto)"}
                    </td>
                    <td className="px-4 py-3">
                      {r.passes ? <StatusBadge status="paid" label="Passa" /> : <StatusBadge status="overdue" label="Falha" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Tipografia */}
        <Section id="tipografia" title="Tipografia" description="Nunito Sans para títulos, DM Sans para interface e valores, JetBrains Mono para códigos.">
          <ul role="list" className="flex flex-col">
            {TYPE_SCALE.map((t) => (
              <li key={t.name} className="flex flex-col gap-2 border-b py-4 last:border-b-0 md:flex-row md:items-baseline md:gap-8">
                <div className="w-56 shrink-0">
                  <p className="font-mono text-code">{t.name}</p>
                  <p className="text-body-small text-muted-foreground">{t.spec}</p>
                </div>
                <p className={cn(t.cls, "min-w-0 break-words")}>{t.sample}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Valores com tabular-nums</CardTitle>
                <CardDescription>Classe .money: DM Sans 700 com algarismos de largura fixa — as casas decimais alinham.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-2">
                  {[
                    ["Aluguel", 285000],
                    ["Luz", 21137],
                    ["Internet", 11990],
                    ["Total", 418127],
                  ].map(([label, cents]) => (
                    <div key={label} className="flex justify-between border-b pb-2 last:border-b-0 last:pb-0">
                      <dt className="text-body-large">{label}</dt>
                      <dd>
                        <Money cents={cents as number} className="text-body-large" />
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Espaçamento */}
        <Section id="espacamento" title="Espaçamento" description="Base de 8px com meio-passo de 4px. No Tailwind, space-N do design system = p-N, gap-N, m-N (N × 4px).">
          <ul role="list" className="flex flex-col gap-3">
            {SPACING.map((n) => (
              <li key={n} className="flex items-center gap-4">
                <span className="w-24 shrink-0 font-mono text-code">space-{n}</span>
                <span className="tabular w-12 shrink-0 text-body text-muted-foreground">{n * 4}px</span>
                <span aria-hidden="true" className="h-4 rounded-xs bg-foreground" style={{ width: n * 4 }} />
              </li>
            ))}
          </ul>
        </Section>

        {/* Raios */}
        <Section id="raios" title="Raios" description="Nada é quadrado: todo elemento interativo tem pelo menos 4px.">
          <ul role="list" className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {RADII.map((r) => (
              <li key={r.name} className="flex flex-col gap-2">
                <span aria-hidden="true" className={cn("h-20 border-2 border-foreground bg-surface", r.cls)} />
                <p className="font-mono text-code">{r.name}</p>
                <p className="text-body-small text-muted-foreground">{r.usage}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Elevação */}
        <Section id="elevacao" title="Elevação">
          <ul role="list" className="grid gap-6 sm:grid-cols-3">
            {ELEVATIONS.map((e) => (
              <li key={e.name} className={cn("flex h-28 flex-col justify-end rounded-md bg-card p-4", e.cls)}>
                <p className="font-mono text-code">{e.name}</p>
                <p className="text-body-small text-muted-foreground">{e.usage}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Componentes */}
        <Section id="componentes" title="Componentes" description="Base em shadcn/ui, estilizada com os tokens acima. Áreas de toque de 48px.">
          <div className="flex flex-col gap-12">
            <div>
              <Subheading>Botão</Subheading>
              <div className="flex flex-wrap items-center gap-4">
                <Button>Marcar como pago</Button>
                <Button variant="secondary">Editar</Button>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="secondary">
                  <Plus /> Nova conta
                </Button>
                <Button variant="secondary" size="icon" aria-label="Adicionar conta">
                  <Plus />
                </Button>
                <Button disabled>Desabilitado</Button>
                <Button aria-disabled="true" aria-busy="true">
                  <LoaderCircle className="animate-spin motion-reduce:animate-none" /> Salvando…
                </Button>
              </div>
              <p className="mt-4 max-w-2xl text-body text-muted-foreground">
                Coral só no CTA principal, um por tela. O rótulo é escuro (#222) porque branco sobre coral fica em 3.05:1. O
                hover clareia o coral para manter o rótulo acima de 4.5:1.
              </p>
            </div>

            <div>
              <Subheading>Badge de status</Subheading>
              <div className="flex flex-wrap gap-3">
                <StatusBadge status="paid" />
                <StatusBadge status="due" />
                <StatusBadge status="overdue" />
                <StatusBadge status="info" label="3 possíveis assinaturas" />
              </div>
              <p className="mt-4 max-w-2xl text-body text-muted-foreground">
                Status nunca depende só da cor: cor, ícone e texto sempre juntos.
              </p>
            </div>

            <div>
              <Subheading>Card</Subheading>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle>Aluguel</CardTitle>
                      <StatusBadge status="overdue" label="Atrasado há 2 dias" />
                    </div>
                    <CardDescription>Venceu em {formatDueDate("2026-10-10")} · Responsável: Becca</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Money cents={285000} className="text-card-title" />
                  </CardContent>
                  <CardFooter>
                    <Button>
                      <Check /> Marcar como pago
                    </Button>
                  </CardFooter>
                </Card>
                <Card interactive>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle>Internet</CardTitle>
                      <StatusBadge status="paid" />
                    </div>
                    <CardDescription>Pago em {formatDueDate("2026-10-08")} por Becca</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Money cents={11990} className="text-card-title" />
                  </CardContent>
                  <CardFooter>
                    <p className="text-body-small text-muted-foreground">Variante interativa: sobe 2px no hover.</p>
                  </CardFooter>
                </Card>
              </div>
            </div>

            <div>
              <Subheading>Campo de texto</Subheading>
              <div className="grid max-w-3xl gap-6 md:grid-cols-2">
                <TextField label="Nome da conta" placeholder="Ex.: Condomínio" hint="Como a conta aparece na lista." />
                <TextField label="Valor" inputMode="decimal" defaultValue="211,37" className="tabular" />
                <TextField label="Dia de vencimento" inputMode="numeric" defaultValue="35" error="Informe um dia entre 1 e 31." />
                <TextField label="Responsável" defaultValue="Becca" disabled />
              </div>
            </div>

            <div>
              <Subheading>Lista</Subheading>
              <Card className="max-w-2xl py-2">
                <List>
                  <ListRow
                    icon={Home}
                    title="Aluguel"
                    description={`Venceu em ${formatDueDate("2026-10-10")} · Becca`}
                    trailing={
                      <>
                        <Money cents={285000} />
                        <StatusBadge status="overdue" />
                      </>
                    }
                  />
                  <ListRow
                    icon={Zap}
                    title="Luz"
                    description={`Vence em ${formatDueDate("2026-10-20")} · valor estimado`}
                    trailing={
                      <>
                        <Money cents={21137} />
                        <StatusBadge status="due" />
                      </>
                    }
                  />
                  <ListRow
                    icon={Wifi}
                    title="Internet"
                    description={`Pago em ${formatDueDate("2026-10-08")} por Becca`}
                    trailing={
                      <>
                        <Money cents={11990} />
                        <StatusBadge status="paid" />
                      </>
                    }
                  />
                  <ListRow
                    icon={Tv}
                    title="Streaming"
                    description="No cartão Nubank · cobrança dia 22"
                    trailing={
                      <>
                        <Money cents={5590} />
                        <StatusBadge status="info" label="No cartão" />
                      </>
                    }
                  />
                </List>
              </Card>
            </div>

            <div>
              <Subheading>Estados vazio, carregando e erro</Subheading>
              <div className="grid gap-6 lg:grid-cols-3">
                <EmptyState
                  icon={Receipt}
                  title="Nenhuma conta fixa"
                  description="Cadastre aluguel, luz e internet para ver o que vence no mês."
                  action={<Button variant="secondary">Cadastrar conta</Button>}
                />
                <Card>
                  <ListSkeleton rows={3} />
                </Card>
                <ErrorState
                  live={false}
                  description="Não conseguimos ler a linha 14 do arquivo: a data “31/02/2026” não existe."
                  action={<Button variant="secondary">Tentar de novo</Button>}
                />
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
