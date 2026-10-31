-- Corrige a diferença entre patentes de pedidos e de fichas.
-- Mantém a autorização Nacional e a transação da aprovação.
CREATE OR REPLACE FUNCTION public.fju_decidir_patente_inicial(p_pedido_id uuid, p_aprovar boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 v_papel text;
 v_pedido public.fju_pedidos_patente_inicial%ROWTYPE;
 v_jovem uuid;
 v_usuario uuid;
 v_status text;
 v_patente text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
 SELECT papel INTO v_papel FROM public.fju_perfis WHERE usuario_id=auth.uid() AND ativo=true;
 IF v_papel IS DISTINCT FROM 'nacional' THEN RAISE EXCEPTION 'Somente Nacional'; END IF;
 IF p_aprovar IS NULL THEN RAISE EXCEPTION 'Decisão inválida'; END IF;
 SELECT * INTO v_pedido FROM public.fju_pedidos_patente_inicial WHERE id=p_pedido_id FOR UPDATE;
 IF NOT FOUND OR v_pedido.status<>'pendente' THEN RAISE EXCEPTION 'Pedido não está pendente'; END IF;
 SELECT usuario_id,status INTO v_usuario,v_status FROM public.fju_inscricoes_jovens WHERE id=v_pedido.inscricao_id FOR UPDATE;
 SELECT jovem_id INTO v_jovem FROM public.fju_vinculos_conta_jovem WHERE usuario_id=v_usuario AND ativo=true;
 IF p_aprovar THEN
  v_patente:=lower(btrim(v_pedido.patente));
  IF v_patente NOT IN ('cpo','colaborador','obreiro','coordenador') THEN
   RAISE EXCEPTION 'Patente inicial inválida';
  END IF;
  IF v_jovem IS NOT NULL THEN
   UPDATE public.fju_jovens SET patente=v_patente WHERE id=v_jovem AND excluido_em IS NULL AND polo_id=v_pedido.polo_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Ficha vinculada não encontrada na igreja'; END IF;
  ELSIF v_status='pendente' THEN
   IF v_pedido.dados_complementares <> '{}'::jsonb THEN
    v_jovem:=public.fju_aprovar_inscricao_ficha_completa(v_pedido.inscricao_id,v_patente,v_pedido.dados_complementares);
   ELSE
    v_jovem:=public.fju_decidir_inscricao_jovem(v_pedido.inscricao_id,'aprovar',v_patente);
   END IF;
  ELSE
   RAISE EXCEPTION 'Inscrição já analisada sem ficha vinculada';
  END IF;
 END IF;
 UPDATE public.fju_pedidos_patente_inicial
 SET status=CASE WHEN p_aprovar THEN 'aprovado' ELSE 'rejeitado' END,
 decidido_por=auth.uid(),decidido_em=now()
 WHERE id=v_pedido.id;
 RETURN v_jovem;
END;
$function$;
