-- FJU Connect JAPAN — endurecimento de autorização por polo
-- Aplicar manualmente no SQL Editor APÓS revisar as dependências e testar com contas reais.
-- O Merge no GitHub NÃO executa esta migração no Supabase.
--
-- Antes: qualquer perfil ativo com polo_id correspondente passava na função,
-- independentemente do papel.
-- Depois: somente Nacional ativo ou Coordenador ativo do mesmo polo.
-- Mantém a assinatura e SECURITY DEFINER/search_path da função existente.

CREATE OR REPLACE FUNCTION public.fju_acessa_polo(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.fju_perfis
    WHERE usuario_id = (SELECT auth.uid())
      AND ativo = true
      AND (
        papel = 'nacional'
        OR (papel = 'coordenador' AND polo_id = p_id)
      )
  );
$function$;

-- Verificações manuais recomendadas, usando sessões autenticadas:
-- Nacional ativo: TRUE para qualquer polo.
-- Coordenador ativo: TRUE apenas para o seu polo.
-- Jovem, perfil pendente ou conta desativada: FALSE para qualquer polo.
-- Não executar testes como superusuário: auth.uid() precisa representar cada conta.
