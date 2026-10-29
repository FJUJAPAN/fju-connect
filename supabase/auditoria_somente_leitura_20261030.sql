-- Auditoria FJU Connect: SOMENTE LEITURA. Executar no SQL Editor do Supabase.
-- 1. Funcoes e permissoes
SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS argumentos,p.prosecdef AS security_definer,p.proconfig AS configuracao,has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,pg_get_functiondef(p.oid) AS definicao FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'fju_%' ORDER BY p.proname;
-- 2. RLS das tabelas
SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname LIKE 'fju_%' ORDER BY c.relname;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE (schemaname='public' AND tablename LIKE 'fju_%') OR (schemaname='storage' AND tablename='objects') ORDER BY schemaname,tablename,policyname;
-- 3. Permissoes de tabelas
SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name LIKE 'fju_%' AND grantee IN ('anon','authenticated') ORDER BY table_name,grantee;
-- 4. Triggers
SELECT event_object_table,trigger_name,event_manipulation,action_statement FROM information_schema.triggers WHERE event_object_schema='public' AND event_object_table LIKE 'fju_%' ORDER BY event_object_table,trigger_name;
-- Nao publicar os resultados sem revisar possiveis dados sensiveis.
