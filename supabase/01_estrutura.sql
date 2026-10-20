-- ===== Distraction Block: estrutura do banco (Supabase) =====
-- Cole tudo no Supabase do projeto do Distraction Block: SQL Editor → New query → Run.
-- Pode rodar uma vez só. Cada pessoa só enxerga e muda as próprias linhas (RLS).

-- ---------- perfis: nome de quem tem conta (e-mail e senha ficam no login do Supabase) ----------
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 60),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

create policy "perfis: ver o proprio" on public.perfis
  for select to authenticated using ((select auth.uid()) = id);
create policy "perfis: criar o proprio" on public.perfis
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "perfis: editar o proprio" on public.perfis
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Quando alguém cria conta, o perfil nasce com o nome enviado no cadastro
create or replace function public.criar_perfil_do_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'nome', ''), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_do_novo_usuario();

-- ---------- vicios: o que a pessoa está largando (o contador de dias começa em "inicio") ----------
create table public.vicios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 60),
  motivo text not null default '' check (char_length(motivo) <= 280),
  inicio date not null default current_date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index vicios_user_id_idx on public.vicios (user_id);

alter table public.vicios enable row level security;

create policy "vicios: ver os proprios" on public.vicios
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "vicios: criar os proprios" on public.vicios
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "vicios: editar os proprios" on public.vicios
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "vicios: apagar os proprios" on public.vicios
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- recaidas: cada vez que a pessoa recaiu (zera o contador a partir daquela data) ----------
create table public.recaidas (
  id uuid primary key default gen_random_uuid(),
  vicio_id uuid not null references public.vicios (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quando date not null default current_date,
  nota text not null default '' check (char_length(nota) <= 280),
  criado_em timestamptz not null default now()
);

create index recaidas_vicio_id_idx on public.recaidas (vicio_id);
create index recaidas_user_id_idx on public.recaidas (user_id);

alter table public.recaidas enable row level security;

create policy "recaidas: ver as proprias" on public.recaidas
  for select to authenticated using ((select auth.uid()) = user_id);
-- Só pode registrar recaída num vício que é seu
create policy "recaidas: criar as proprias" on public.recaidas
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.vicios v where v.id = vicio_id and v.user_id = (select auth.uid()))
  );
create policy "recaidas: apagar as proprias" on public.recaidas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------- Limites para ninguém encher o banco (30 vícios e 2.000 recaídas por pessoa) ----------
create or replace function public.limitar_linhas_por_pessoa()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total int;
begin
  if tg_table_name = 'vicios' then
    select count(*) into total from public.vicios where user_id = new.user_id;
    if total >= 30 then raise exception 'limite_vicios'; end if;
  else
    select count(*) into total from public.recaidas where user_id = new.user_id;
    if total >= 2000 then raise exception 'limite_recaidas'; end if;
  end if;
  return new;
end;
$$;

create trigger limitar_vicios before insert on public.vicios
  for each row execute function public.limitar_linhas_por_pessoa();
create trigger limitar_recaidas before insert on public.recaidas
  for each row execute function public.limitar_linhas_por_pessoa();

-- Atualiza "atualizado_em" sozinho
create or replace function public.marcar_atualizado()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger perfis_atualizado before update on public.perfis
  for each row execute function public.marcar_atualizado();
create trigger vicios_atualizado before update on public.vicios
  for each row execute function public.marcar_atualizado();

-- Só quem está logado acessa as tabelas (visitantes sem login não veem nada)
revoke all on public.perfis, public.vicios, public.recaidas from anon;
grant select, insert, update on public.perfis to authenticated;
grant select, insert, update, delete on public.vicios to authenticated;
grant select, insert, delete on public.recaidas to authenticated;
