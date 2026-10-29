-- FJU Connect JAPAN: restringir patentes elevadas na aprovação inicial.
-- Aplicar MANUALMENTE no Supabase SQL Editor após revisar.
-- Merge no GitHub não executa esta migração.
-- Mantém assinaturas, permissões EXECUTE, fluxo de rejeição e registros existentes.
CREATE OR REPLACE FUNCTION public.fju_decidir_inscricao_jovem(
 p_inscricao_id uuid, p_acao text, p_patente text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
 v_papel text;
 v_polo uuid;
 v_inscricao public.fju_inscricoes_jovens%ROWTYPE;
 v_jovem uuid;
 v_patente text;
 v_categoria text;
BEGIN
 IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'Faça login';
 END IF;

 SELECT papel,polo_id INTO v_papel,v_polo
 FROM public.fju_perfis
 WHERE usuario_id=auth.uid() AND ativo=true;

 IF v_papel IS NULL OR v_papel NOT IN ('nacional','coordenador') THEN
  RAISE EXCEPTION 'Sem autorização para analisar inscrições';
 END IF;

 IF p_acao IS NULL OR p_acao NOT IN ('aprovar','rejeitar') THEN
  RAISE EXCEPTION 'Ação inválida';
 END IF;

 SELECT * INTO v_inscricao
 FROM public.fju_inscricoes_jovens
 WHERE id=p_inscricao_id
 FOR UPDATE;

 IF NOT FOUND THEN
  RAISE EXCEPTION 'Inscrição não encontrada';
 END IF;

 IF v_inscricao.status<>'pendente' THEN
  RAISE EXCEPTION 'Inscrição já analisada';
 END IF;

 IF v_papel='coordenador'
    AND (v_polo IS NULL OR v_polo IS DISTINCT FROM v_inscricao.polo_id) THEN
  RAISE EXCEPTION 'Inscrição de outro polo';
 END IF;

 IF p_acao='rejeitar' THEN
  UPDATE public.fju_inscricoes_jovens
  SET status='rejeitado', analisado_por=auth.uid(), analisado_em=now()
  WHERE id=v_inscricao.id;
  RETURN NULL;
 END IF;

 IF p_patente IS NULL OR p_patente NOT IN (
  'Inconstante','Firme','CPO','Colaborador','Obreiro','Coordenador'
 ) THEN
  RAISE EXCEPTION 'Selecione uma patente inicial válida';
 END IF;

 -- Defesa no banco: coordenador pode aprovar jovens do próprio polo,
 -- mas somente o Nacional pode conceder patente acima de Firme.
 -- A função fju_aprovar_inscricao_ficha_completa chama esta função,
 -- portanto recebe automaticamente a mesma proteção.
 IF v_papel='coordenador' AND p_patente NOT IN ('Inconstante','Firme') THEN
  RAISE EXCEPTION 'Patente superior a Firme exige aprovação Nacional';
 END IF;

 IF EXISTS(
  SELECT 1 FROM public.fju_vinculos_conta_jovem
  WHERE usuario_id=v_inscricao.usuario_id
 ) THEN
  RAISE EXCEPTION 'Conta já vinculada a uma ficha';
 END IF;

 IF EXISTS(
  SELECT 1 FROM public.fju_jovens
  WHERE polo_id=v_inscricao.polo_id
  AND lower(btrim(nome_completo))=lower(btrim(v_inscricao.nome))
 ) THEN
  RAISE EXCEPTION 'Já existe ficha com esse nome no polo. Confira antes de aprovar';
 END IF;

 v_categoria:=CASE
  WHEN p_patente='Inconstante' THEN 'inconstante'
  ELSE 'firme'
 END;

 v_patente:=CASE
  WHEN p_patente IN ('Inconstante','Firme') THEN NULL
  ELSE lower(p_patente)
 END;

 INSERT INTO public.fju_jovens (
  polo_id,nome_completo,nascimento,telefone,
  nacionalidade_iso2,patente,categoria
 )
 VALUES (
  v_inscricao.polo_id,v_inscricao.nome,v_inscricao.nascimento,
  v_inscricao.telefone,v_inscricao.nacionalidade_iso2,
  v_patente,v_categoria
 )
 RETURNING id INTO v_jovem;

 INSERT INTO public.fju_vinculos_conta_jovem (
  jovem_id,usuario_id,liberado_por,ativo
 )
 VALUES (
  v_jovem,v_inscricao.usuario_id,auth.uid(),true
 );

 UPDATE public.fju_inscricoes_jovens
 SET status='aprovado', analisado_por=auth.uid(), analisado_em=now()
 WHERE id=v_inscricao.id;

 RETURN v_jovem;
END;
$function$;

-- Conferência após execução:
-- SELECT pg_get_functiondef('public.fju_decidir_inscricao_jovem(uuid,text,text)'::regprocedure);
