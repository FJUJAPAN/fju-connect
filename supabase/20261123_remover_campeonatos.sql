-- FJU CONNECT JAPAN | Remover todo o módulo de campeonatos do banco
-- Data: 23/11/2026
--
-- ATENÇÃO: apaga DE VEZ times, jogadores e campeonatos, SEM backup.
-- Decisão confirmada pela coordenação: o módulo será recriado do zero.
--
-- Fecha o vazamento de dados descrito no item C1 da auditoria
-- (busca anônima por FJU ID devolvendo nome, nascimento e endereço).
--
-- Como usar: Supabase → SQL Editor → colar tudo → Run.
-- Depois siga o PASSO 2 no fim deste arquivo (fotos no Storage).
--
-- O que NÃO é tocado: o bucket principal de fotos dos jovens (fju-fotos),
-- as fichas (fju_jovens), as identidades (fju_identidades) e os polos.

begin;

-- 1) Funções: remove TODAS as funções cujo nome começa com fju_campeonato,
--    nos esquemas public e private. Isso inclui funções que nunca foram
--    salvas no GitHub (ex.: fju_campeonato_criar_v2, fju_campeonato_eventos_publicos).
do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public','private')
      and p.proname like 'fju\_campeonato%'
  loop
    execute format('drop function if exists %I.%I(%s) cascade', r.nspname, r.proname, r.args);
    raise notice 'Função removida: %.%(%)', r.nspname, r.proname, r.args;
  end loop;
end $$;

-- 2) Políticas de Storage do campeonato (inclui a política que dava acesso
--    às fotos de perfil do bucket fju-fotos; o bucket em si continua).
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname ilike '%campeonato%'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
    raise notice 'Política removida: %', r.policyname;
  end loop;
end $$;

-- 3) Tabelas (as políticas, índices e restrições delas saem junto).
drop table if exists public.fju_campeonatos_jogadores cascade;
drop table if exists public.fju_campeonatos_times cascade;
drop table if exists public.fju_campeonatos cascade;

-- 4) Conferência: tudo deve voltar vazio. Se algo aparecer, a transação é desfeita.
do $$
declare v_funcs int; v_tabs int; v_pols int;
begin
  select count(*) into v_funcs from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private') and p.proname like 'fju\_campeonato%';
  select count(*) into v_tabs from pg_tables
    where schemaname='public' and tablename like 'fju\_campeonato%';
  select count(*) into v_pols from pg_policies
    where policyname ilike '%campeonato%';
  if v_funcs + v_tabs + v_pols > 0 then
    raise exception 'Ainda restam objetos do campeonato: % funções, % tabelas, % políticas', v_funcs, v_tabs, v_pols;
  end if;
end $$;

commit;

-- PASSO 2 — Fotos (fazer pelo painel, não pelo SQL):
-- O Supabase não permite apagar arquivos do Storage direto pelo SQL.
-- Supabase → Storage → para cada bucket abaixo: "Empty bucket" e depois "Delete bucket".
--   • fju-campeonato-jogadores  (fotos dos jogadores)
--   • fju-campeonatos-capas     (capas dos campeonatos)
-- NÃO mexer no bucket fju-fotos.
