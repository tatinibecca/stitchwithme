-- Fase 2 · Categorias, contas fixas e ocorrências (PRD §4.1, §5.3, §6)
--
-- - Valores em centavos (integer > 0).
-- - A conta (bills) é o modelo; a ocorrência (bill_occurrences) é o mês.
-- - "Atrasado" não é gravado: o app calcula pela data no fuso America/Sao_Paulo.
-- - Escrita em ocorrências só por funções: quem marcou como pago é sempre quem chamou.

-- ---------------------------------------------------------------------------
-- Categorias (padrão do PRD §4.3, criadas para cada casa)
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint categories_unique_name unique (household_id, name)
);
create index categories_household_id_idx on public.categories (household_id);

create function public.seed_default_categories(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (household_id, name, icon, is_default)
  select target, c.name, c.icon, true
  from (values
    ('Moradia', 'house'), ('Mercado', 'shopping-cart'), ('Alimentação fora', 'utensils'),
    ('Transporte/Carro', 'car'), ('Saúde', 'heart-pulse'), ('Pets', 'paw-print'),
    ('Lazer', 'party-popper'), ('Viagens', 'plane'), ('Assinaturas', 'repeat'),
    ('Compras', 'shopping-bag'), ('Educação', 'graduation-cap'), ('Outros', 'ellipsis')
  ) as c (name, icon)
  on conflict (household_id, name) do nothing;
$$;

create function public.households_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end;
$$;

create trigger households_seed_categories
  after insert on public.households
  for each row execute function public.households_after_insert();

-- Casas criadas antes desta migration
select public.seed_default_categories(id) from public.households;

-- ---------------------------------------------------------------------------
-- Contas fixas
-- ---------------------------------------------------------------------------

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  category_id uuid references public.categories (id) on delete set null,
  owner_member_id uuid not null references public.members (id),
  amount integer not null check (amount > 0),
  is_estimated boolean not null default false,
  due_day smallint not null check (due_day between 1 and 31),
  recurrence_rule text not null default 'monthly' check (recurrence_rule in ('monthly', 'yearly')),
  -- extensão: mês do vencimento das contas anuais (IPVA, seguro…)
  due_month smallint check (due_month between 1 and 12),
  reminder_offsets integer[] not null default '{3,0}',
  payment_method text check (payment_method in ('boleto', 'debito_automatico', 'pix', 'cartao', 'outro')),
  notes text check (char_length(notes) <= 280),
  active boolean not null default true,
  -- extensão: primeiro mês em que a conta gera ocorrência (dia 1 do mês)
  starts_on date not null default date_trunc('month', (now() at time zone 'America/Sao_Paulo'))::date,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  constraint bills_yearly_has_month check (recurrence_rule <> 'yearly' or due_month is not null),
  constraint bills_starts_on_first_day check (extract(day from starts_on) = 1)
);
create index bills_household_id_idx on public.bills (household_id);

create table public.bill_occurrences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  bill_id uuid not null references public.bills (id) on delete cascade,
  -- extensão: mês de referência (dia 1), para "Luz — out/2026" não duplicar se a data mudar
  reference_month date not null check (extract(day from reference_month) = 1),
  due_date date not null,
  expected_amount integer not null check (expected_amount > 0),
  paid_amount integer check (paid_amount > 0),
  paid_at date,
  paid_by_member_id uuid references public.members (id),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  constraint bill_occurrences_one_per_month unique (bill_id, reference_month),
  constraint bill_occurrences_paid_fields check (
    (status = 'paid' and paid_amount is not null and paid_at is not null and paid_by_member_id is not null)
    or (status = 'pending' and paid_amount is null and paid_at is null and paid_by_member_id is null)
  )
);
create index bill_occurrences_household_month_idx on public.bill_occurrences (household_id, reference_month);

-- ---------------------------------------------------------------------------
-- Datas (mesma regra de lib/bills/recurrence.ts, testada nos dois lados)
-- ---------------------------------------------------------------------------

-- Vencimento da conta no mês, ou null se ela não vence nesse mês.
-- Dia 31 em mês de 30 dias vira 30; em fevereiro, 28 ou 29.
create function public.bill_due_date(
  p_due_day int, p_rule text, p_due_month int, p_starts_on date, p_month date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_month < p_starts_on then null
    when p_rule = 'yearly' and extract(month from p_month)::int <> p_due_month then null
    else make_date(
      extract(year from p_month)::int,
      extract(month from p_month)::int,
      least(p_due_day, extract(day from (p_month + interval '1 month - 1 day'))::int)
    )
  end;
$$;

create function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.members where user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Permissões e RLS
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.bills enable row level security;
alter table public.bill_occurrences enable row level security;

revoke all on public.categories, public.bills, public.bill_occurrences from anon, authenticated;

grant select on public.categories to authenticated;
grant select on public.bills to authenticated;
grant insert (household_id, name, category_id, owner_member_id, amount, is_estimated, due_day,
              recurrence_rule, due_month, reminder_offsets, payment_method, notes, starts_on)
  on public.bills to authenticated;
grant update (name, category_id, owner_member_id, amount, is_estimated, due_day, recurrence_rule,
              due_month, reminder_offsets, payment_method, notes, active)
  on public.bills to authenticated;
grant select on public.bill_occurrences to authenticated;

create policy categories_select on public.categories
  for select to authenticated using (public.is_household_member(household_id));

create policy bills_select on public.bills
  for select to authenticated using (public.is_household_member(household_id));

-- Responsável e categoria precisam ser da mesma casa.
create policy bills_insert on public.bills
  for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and exists (select 1 from public.members m where m.id = owner_member_id and m.household_id = bills.household_id)
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.household_id = bills.household_id))
  );

create policy bills_update on public.bills
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and exists (select 1 from public.members m where m.id = owner_member_id and m.household_id = bills.household_id)
    and (category_id is null or exists (
      select 1 from public.categories c where c.id = category_id and c.household_id = bills.household_id))
  );

create policy bill_occurrences_select on public.bill_occurrences
  for select to authenticated using (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Funções (RPC)
-- ---------------------------------------------------------------------------

-- Cria as ocorrências que faltam no mês para as contas ativas da casa de quem chamou.
-- Idempotente. Devolve quantas criou.
create function public.generate_bill_occurrences(p_month date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := public.current_member_id();
  v_household uuid;
  v_month date := date_trunc('month', p_month)::date;
  v_count integer;
begin
  if v_member is null then
    raise exception 'no_household';
  end if;
  select household_id into v_household from public.members where id = v_member;

  insert into public.bill_occurrences (household_id, bill_id, reference_month, due_date, expected_amount)
  select b.household_id, b.id, v_month,
         public.bill_due_date(b.due_day, b.recurrence_rule, b.due_month, b.starts_on, v_month),
         b.amount
  from public.bills b
  where b.household_id = v_household
    and b.active
    and public.bill_due_date(b.due_day, b.recurrence_rule, b.due_month, b.starts_on, v_month) is not null
  on conflict (bill_id, reference_month) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.mark_bill_occurrence_paid(p_occurrence uuid, p_amount integer, p_paid_on date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := public.current_member_id();
begin
  if v_member is null then
    raise exception 'no_household';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  if p_paid_on is null or p_paid_on > (now() at time zone 'America/Sao_Paulo')::date + 1 then
    raise exception 'invalid_date';
  end if;

  update public.bill_occurrences o
     set status = 'paid', paid_amount = p_amount, paid_at = p_paid_on, paid_by_member_id = v_member
   where o.id = p_occurrence
     and public.is_household_member(o.household_id);
  if not found then
    raise exception 'occurrence_not_found';
  end if;
end;
$$;

create function public.unmark_bill_occurrence_paid(p_occurrence uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bill_occurrences o
     set status = 'pending', paid_amount = null, paid_at = null, paid_by_member_id = null
   where o.id = p_occurrence
     and public.is_household_member(o.household_id);
  if not found then
    raise exception 'occurrence_not_found';
  end if;
end;
$$;

-- Edição "só esta": muda valor e data de uma ocorrência ainda não paga.
create function public.update_bill_occurrence(p_occurrence uuid, p_expected_amount integer, p_due_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_expected_amount is null or p_expected_amount <= 0 then
    raise exception 'invalid_amount';
  end if;
  update public.bill_occurrences o
     set expected_amount = p_expected_amount, due_date = p_due_date
   where o.id = p_occurrence
     and o.status = 'pending'
     and date_trunc('month', p_due_date) = o.reference_month
     and public.is_household_member(o.household_id);
  if not found then
    raise exception 'occurrence_not_editable';
  end if;
end;
$$;

-- Edição "esta e as próximas": depois de atualizar a conta (bills), reaplica o
-- valor e o vencimento nas ocorrências ainda não pagas a partir do mês escolhido.
-- Ocorrências passadas e pagas ficam como estão (histórico).
create function public.reapply_bill_from(p_bill uuid, p_from_month date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill public.bills%rowtype;
  v_count integer;
begin
  select * into v_bill from public.bills where id = p_bill;
  if not found or not public.is_household_member(v_bill.household_id) then
    raise exception 'bill_not_found';
  end if;

  -- meses em que a conta deixou de vencer (ex.: virou anual) somem, se não pagos
  delete from public.bill_occurrences o
   where o.bill_id = p_bill and o.status = 'pending' and o.reference_month >= date_trunc('month', p_from_month)
     and public.bill_due_date(v_bill.due_day, v_bill.recurrence_rule, v_bill.due_month, v_bill.starts_on, o.reference_month) is null;

  update public.bill_occurrences o
     set expected_amount = v_bill.amount,
         due_date = public.bill_due_date(v_bill.due_day, v_bill.recurrence_rule, v_bill.due_month, v_bill.starts_on, o.reference_month)
   where o.bill_id = p_bill and o.status = 'pending' and o.reference_month >= date_trunc('month', p_from_month);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke all on function public.households_after_insert() from public, anon, authenticated;
revoke all on function public.bill_due_date(int, text, int, date, date) from public, anon;
revoke all on function public.current_member_id() from public, anon;
revoke all on function public.generate_bill_occurrences(date) from public, anon;
revoke all on function public.mark_bill_occurrence_paid(uuid, integer, date) from public, anon;
revoke all on function public.unmark_bill_occurrence_paid(uuid) from public, anon;
revoke all on function public.update_bill_occurrence(uuid, integer, date) from public, anon;
revoke all on function public.reapply_bill_from(uuid, date) from public, anon;

grant execute on function public.bill_due_date(int, text, int, date, date) to authenticated;
grant execute on function public.current_member_id() to authenticated;
grant execute on function public.generate_bill_occurrences(date) to authenticated;
grant execute on function public.mark_bill_occurrence_paid(uuid, integer, date) to authenticated;
grant execute on function public.unmark_bill_occurrence_paid(uuid) to authenticated;
grant execute on function public.update_bill_occurrence(uuid, integer, date) to authenticated;
grant execute on function public.reapply_bill_from(uuid, date) to authenticated;
