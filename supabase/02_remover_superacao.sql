-- ===== Distraction Block: remover a Superação (vícios e recaídas) =====
-- Só precisa rodar se você JÁ rodou a versão antiga do 01_estrutura.sql (a que criava "vicios" e "recaidas").
-- Atenção: apaga essas duas tabelas e tudo o que estiver nelas. O login e a tabela "perfis" continuam.
-- SQL Editor → New query → cole → Run.

drop table if exists public.recaidas;
drop table if exists public.vicios;
drop function if exists public.limitar_linhas_por_pessoa();
