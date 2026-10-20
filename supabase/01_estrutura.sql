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

-- Só quem está logado acessa as tabelas (visitantes sem login não veem nada)
revoke all on public.perfis from anon;
grant select, insert, update on public.perfis to authenticated;
