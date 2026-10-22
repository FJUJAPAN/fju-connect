-- FJU CONNECT JAPAN — diagnóstico SOMENTE LEITURA
-- Execute no SQL Editor ANTES de aplicar 20261023_restringir_fju_acessa_polo_papel.sql.
-- Não altera dados, políticas, permissões ou funções.

-- 1) Políticas RLS que usam a função: validar todas as tabelas afetadas.
SELECT schemaname, tablename, policyname, cmd, roles,
       qual, with_check
FROM pg_policies
WHERE (coalesce(qual,'') || ' ' || coalesce(with_check,'')) ILIKE '%fju_acessa_polo%'
ORDER BY tablename, policyname;

-- 2) Outras funções públicas que mencionam a função.
SELECT n.nspname AS esquema, p.proname AS funcao,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname <> 'fju_acessa_polo'
  AND pg_get_functiondef(p.oid) ILIKE '%fju_acessa_polo%'
ORDER BY p.proname;

-- 3) Distribuição de papéis: contagens, SEM mostrar identidades.
SELECT papel, ativo, count(*) AS quantidade,
       count(*) FILTER (WHERE polo_id IS NULL) AS sem_polo
FROM public.fju_perfis
GROUP BY papel, ativo
ORDER BY papel, ativo;

-- 4) Definição atual da função (confirma se a migração ainda é necessária).
SELECT pg_get_functiondef('public.fju_acessa_polo(uuid)'::regprocedure)
  AS definicao_atual;

-- TESTE MANUAL após revisão:
-- [ ] Nacional ativo pode consultar todos os polos.
-- [ ] Coordenador ativo só consulta fichas e fotos do seu polo.
-- [ ] Jovem, perfil pendente e conta desativada não acessam fichas privadas.
-- [ ] Coordenador continua vendo fotos autorizadas via fju_pode_ver_foto.
-- IMPORTANTE: SQL Editor com privilégio elevado NÃO simula auth.uid() de
-- um usuário autenticado. Os testes de autorização exigem sessões reais.
