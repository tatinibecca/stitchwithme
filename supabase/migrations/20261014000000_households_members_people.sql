-- Fase 1 · Casa, membros, pessoas e convites (PRD §3, §6)
--
-- Regras:
-- - Toda tabela tem household_id e RLS: um usuário só enxerga a própria casa.
-- - Criar casa e aceitar convite só por funções (RPC) que validam tudo no banco.
-- - O token do convite nunca é guardado: só o hash SHA-256.
-- - No MVP, cada usuário pertence a uma casa só (members_one_household_per_user).

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  constraint members_one_household_per_user unique (user_id)
);
create index members_household_id_idx on public.members (household_id);

-- Pessoas: quem pode ser responsável por um gasto. Inclui os membros (member_id
-- preenchido) e quem não usa o app, como um familiar que usa o cartão.
create table public.people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  member_id uuid unique references public.members (id) on delete set null,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now()
);
create index people_household_id_idx on public.people (household_id);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id),
  revoked_at timestamptz
);
create index household_invites_household_id_idx on public.household_invites (household_id);

-- ---------------------------------------------------------------------------
-- Auxiliares
-- ---------------------------------------------------------------------------

-- security definer: consulta members sem passar pela RLS de members (evita recursão).
create function public.is_household_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members m
    where m.household_id = target and m.user_id = (select auth.uid())
  );
$$;

create function public.hash_invite_token(token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(token, 'UTF8')), 'hex');
$$;

-- ---------------------------------------------------------------------------
-- Permissões e RLS
-- O Supabase concede tudo a anon/authenticated por padrão no schema public:
-- revogamos e concedemos só o necessário, coluna a coluna quando faz sentido.
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.people enable row level security;
alter table public.household_invites enable row level security;

revoke all on public.households, public.members, public.people, public.household_invites from anon, authenticated;

grant select on public.households to authenticated;
grant update (name) on public.households to authenticated;

grant select on public.members to authenticated;
grant update (display_name) on public.members to authenticated;

grant select, delete on public.people to authenticated;
grant insert (household_id, display_name) on public.people to authenticated;
grant update (display_name) on public.people to authenticated;

-- token_hash fica de fora: nem membros da casa leem o hash.
grant select (id, household_id, created_by, created_at, expires_at, accepted_at, accepted_by, revoked_at)
  on public.household_invites to authenticated;
grant update (revoked_at) on public.household_invites to authenticated;

create policy households_select on public.households
  for select to authenticated using (public.is_household_member(id));
create policy households_update on public.households
  for update to authenticated
  using (public.is_household_member(id)) with check (public.is_household_member(id));

create policy members_select on public.members
  for select to authenticated using (public.is_household_member(household_id));
create policy members_update_self on public.members
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy people_select on public.people
  for select to authenticated using (public.is_household_member(household_id));
create policy people_insert on public.people
  for insert to authenticated with check (public.is_household_member(household_id));
create policy people_update on public.people
  for update to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
-- Pessoa ligada a um membro não pode ser apagada.
create policy people_delete on public.people
  for delete to authenticated using (public.is_household_member(household_id) and member_id is null);

create policy household_invites_select on public.household_invites
  for select to authenticated using (public.is_household_member(household_id));
create policy household_invites_revoke on public.household_invites
  for update to authenticated
  using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

-- ---------------------------------------------------------------------------
-- Funções (RPC)
-- Erros usam mensagens estáveis em inglês; a interface traduz para pt-BR.
-- ---------------------------------------------------------------------------

create function public.create_household(p_name text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_household uuid;
  v_member uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if exists (select 1 from public.members where user_id = v_uid) then
    raise exception 'already_member';
  end if;

  insert into public.households (name, created_by) values (btrim(p_name), v_uid) returning id into v_household;
  insert into public.members (household_id, user_id, display_name, role)
    values (v_household, v_uid, btrim(p_display_name), 'owner') returning id into v_member;
  insert into public.people (household_id, member_id, display_name)
    values (v_household, v_member, btrim(p_display_name));

  return v_household;
end;
$$;

-- Devolve o token em texto uma única vez; o banco guarda só o hash.
create function public.create_household_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_household uuid;
  v_token text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select household_id into v_household from public.members where user_id = v_uid;
  if v_household is null then
    raise exception 'no_household';
  end if;

  -- 2 UUIDs v4 = 244 bits aleatórios
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.household_invites (household_id, token_hash, created_by)
    values (v_household, public.hash_invite_token(v_token), v_uid);
  return v_token;
end;
$$;

-- Prévia do convite para a tela de aceite: nome da casa, quem convidou e situação.
create function public.get_household_invite(p_token text)
returns table (household_name text, invited_by text, status text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_invite public.household_invites%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_invite from public.household_invites where token_hash = public.hash_invite_token(p_token);
  if not found then
    return query select null::text, null::text, 'not_found'::text;
    return;
  end if;

  return query
    select h.name,
           (select m.display_name from public.members m where m.user_id = v_invite.created_by),
           case
             when v_invite.revoked_at is not null then 'revoked'
             when v_invite.accepted_at is not null then 'used'
             when v_invite.expires_at <= now() then 'expired'
             else 'valid'
           end
    from public.households h where h.id = v_invite.household_id;
end;
$$;

create function public.accept_household_invite(p_token text, p_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invite public.household_invites%rowtype;
  v_current uuid;
  v_member uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_invite from public.household_invites
    where token_hash = public.hash_invite_token(p_token)
    for update;
  if not found then
    raise exception 'invite_not_found';
  end if;

  select household_id into v_current from public.members where user_id = v_uid;
  if v_current = v_invite.household_id then
    return v_current; -- já é da casa: aceitar de novo não faz nada
  elsif v_current is not null then
    raise exception 'already_member';
  end if;

  if v_invite.revoked_at is not null then
    raise exception 'invite_revoked';
  elsif v_invite.accepted_at is not null then
    raise exception 'invite_used';
  elsif v_invite.expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  insert into public.members (household_id, user_id, display_name, role)
    values (v_invite.household_id, v_uid, btrim(p_display_name), 'member') returning id into v_member;
  insert into public.people (household_id, member_id, display_name)
    values (v_invite.household_id, v_member, btrim(p_display_name));
  update public.household_invites set accepted_at = now(), accepted_by = v_uid where id = v_invite.id;

  return v_invite.household_id;
end;
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.hash_invite_token(text) from public, anon, authenticated;
revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.create_household_invite() from public, anon;
revoke all on function public.get_household_invite(text) from public, anon;
revoke all on function public.accept_household_invite(text, text) from public, anon;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.create_household_invite() to authenticated;
grant execute on function public.get_household_invite(text) to authenticated;
grant execute on function public.accept_household_invite(text, text) to authenticated;
