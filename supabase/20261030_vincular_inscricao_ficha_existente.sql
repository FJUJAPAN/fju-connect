-- Vincula uma inscrição pendente a uma ficha existente, sem duplicar jovem.
-- Executar manualmente no Supabase após revisão. Merge não executa SQL.
CREATE OR REPLACE FUNCTION public.fju_vincular_inscricao_ficha_existente(
 p_inscricao_id uuid, p_jovem_id uuid
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE
 v_papel text;
 v_polo uuid;
 v_inscricao public.fju_inscricoes_jovens%ROWTYPE;
 v_ficha public.fju_jovens%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
 SELECT papel,polo_id INTO v_papel,v_polo
 FROM public.fju_perfis WHERE usuario_id=auth.uid() AND ativo=true;
 IF v_papel NOT IN ('nacional','coordenador') OR v_papel IS NULL THEN
  RAISE EXCEPTION 'Sem autorização'; END IF;
 SELECT * INTO v_inscricao FROM public.fju_inscricoes_jovens
 WHERE id=p_inscricao_id FOR UPDATE;
 IF NOT FOUND OR v_inscricao.status IS DISTINCT FROM 'pendente' THEN
  RAISE EXCEPTION 'Inscrição inexistente ou já analisada'; END IF;
 SELECT * INTO v_ficha FROM public.fju_jovens WHERE id=p_jovem_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Ficha não encontrada'; END IF;
 IF v_ficha.polo_id IS DISTINCT FROM v_inscricao.polo_id THEN
  RAISE EXCEPTION 'Ficha e inscrição pertencem a igrejas diferentes'; END IF;
 IF v_papel='coordenador' AND (v_polo IS NULL OR v_polo IS DISTINCT FROM v_inscricao.polo_id) THEN
  RAISE EXCEPTION 'Inscrição de outra igreja'; END IF;
 IF EXISTS(SELECT 1 FROM public.fju_vinculos_conta_jovem
           WHERE usuario_id=v_inscricao.usuario_id OR jovem_id=p_jovem_id) THEN
  RAISE EXCEPTION 'Conta ou ficha já possui vínculo; solicite análise'; END IF;
 INSERT INTO public.fju_vinculos_conta_jovem(jovem_id,usuario_id,liberado_por,ativo)
 VALUES(p_jovem_id,v_inscricao.usuario_id,auth.uid(),true);
 UPDATE public.fju_inscricoes_jovens
 SET status='aprovado',analisado_por=auth.uid(),analisado_em=now()
 WHERE id=p_inscricao_id;
 RETURN p_jovem_id;
END;
$$;
REVOKE ALL ON FUNCTION public.fju_vincular_inscricao_ficha_existente(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fju_vincular_inscricao_ficha_existente(uuid,uuid) TO authenticated;
