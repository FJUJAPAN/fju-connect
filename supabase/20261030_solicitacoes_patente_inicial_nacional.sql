-- Aplicar no Supabase SQL Editor após merge. Não executa automaticamente.
-- Solicitações de patente inicial elevada: coordenador pede; Nacional decide.
CREATE TABLE IF NOT EXISTS public.fju_pedidos_patente_inicial (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 inscricao_id uuid NOT NULL REFERENCES public.fju_inscricoes_jovens(id) ON DELETE CASCADE,
 polo_id uuid NOT NULL,
 patente text NOT NULL CHECK (patente IN ('CPO','Colaborador','Obreiro','Coordenador')),
 solicitado_por uuid NOT NULL,
 solicitado_em timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
 decidido_por uuid,
 decidido_em timestamptz,
 dados_complementares jsonb NOT NULL DEFAULT '{}'::jsonb,
 CONSTRAINT fju_pedidos_patente_inicial_inscricao_unique UNIQUE(inscricao_id)
);
ALTER TABLE public.fju_pedidos_patente_inicial ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fju_pedidos_patente_inicial FROM anon, authenticated;
CREATE INDEX IF NOT EXISTS fju_pedidos_patente_inicial_status_idx ON public.fju_pedidos_patente_inicial(status, solicitado_em DESC);

CREATE OR REPLACE FUNCTION public.fju_solicitar_patente_inicial(
 p_inscricao_id uuid, p_patente text, p_dados jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE v_papel text; v_polo uuid; v_inscricao public.fju_inscricoes_jovens%ROWTYPE; v_id uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
 SELECT papel,polo_id INTO v_papel,v_polo FROM public.fju_perfis
 WHERE usuario_id=auth.uid() AND ativo=true;
 IF v_papel NOT IN ('coordenador','nacional') OR v_papel IS NULL THEN
  RAISE EXCEPTION 'Sem autorização'; END IF;
 IF p_patente IS NULL OR p_patente NOT IN ('CPO','Colaborador','Obreiro','Coordenador') THEN
  RAISE EXCEPTION 'Patente inválida'; END IF;
 IF p_dados IS NULL OR jsonb_typeof(p_dados)<>'object' THEN
  RAISE EXCEPTION 'Dados complementares inválidos'; END IF;
 SELECT * INTO v_inscricao FROM public.fju_inscricoes_jovens WHERE id=p_inscricao_id FOR UPDATE;
 IF NOT FOUND OR v_inscricao.status<>'pendente' THEN
  RAISE EXCEPTION 'Inscrição não está pendente'; END IF;
 IF v_papel='coordenador' AND (v_polo IS NULL OR v_polo IS DISTINCT FROM v_inscricao.polo_id) THEN
  RAISE EXCEPTION 'Inscrição de outro polo'; END IF;
 INSERT INTO public.fju_pedidos_patente_inicial(inscricao_id,polo_id,patente,solicitado_por,dados_complementares)
 VALUES(p_inscricao_id,v_inscricao.polo_id,p_patente,auth.uid(),p_dados)
 ON CONFLICT(inscricao_id) DO NOTHING RETURNING id INTO v_id;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Já existe solicitação de patente para esta inscrição'; END IF;
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.fju_listar_pedidos_patente_inicial()
RETURNS TABLE(id uuid, inscricao_id uuid, polo_id uuid, nome text, patente text, solicitado_em timestamptz, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE v_papel text; v_polo uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
 SELECT p.papel,p.polo_id INTO v_papel,v_polo FROM public.fju_perfis p
 WHERE p.usuario_id=auth.uid() AND p.ativo=true;
 IF v_papel IS NULL OR v_papel NOT IN ('nacional','coordenador') THEN
  RAISE EXCEPTION 'Sem autorização'; END IF;
 RETURN QUERY SELECT r.id,r.inscricao_id,r.polo_id,i.nome::text,r.patente,r.solicitado_em,r.status
 FROM public.fju_pedidos_patente_inicial r
 JOIN public.fju_inscricoes_jovens i ON i.id=r.inscricao_id
 WHERE r.status='pendente' AND (v_papel='nacional' OR (v_papel='coordenador' AND r.polo_id=v_polo))
 ORDER BY r.solicitado_em DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.fju_decidir_patente_inicial(
 p_pedido_id uuid, p_aprovar boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE v_papel text; v_pedido public.fju_pedidos_patente_inicial%ROWTYPE; v_jovem uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Faça login'; END IF;
 SELECT papel INTO v_papel FROM public.fju_perfis WHERE usuario_id=auth.uid() AND ativo=true;
 IF v_papel IS DISTINCT FROM 'nacional' THEN RAISE EXCEPTION 'Somente Nacional'; END IF;
 IF p_aprovar IS NULL THEN RAISE EXCEPTION 'Decisão inválida'; END IF;
 SELECT * INTO v_pedido FROM public.fju_pedidos_patente_inicial WHERE id=p_pedido_id FOR UPDATE;
 IF NOT FOUND OR v_pedido.status<>'pendente' THEN RAISE EXCEPTION 'Pedido não está pendente'; END IF;
 IF p_aprovar THEN
  IF v_pedido.dados_complementares <> '{}'::jsonb THEN
   v_jovem:=public.fju_aprovar_inscricao_ficha_completa(v_pedido.inscricao_id,v_pedido.patente,v_pedido.dados_complementares);
  ELSE
   v_jovem:=public.fju_decidir_inscricao_jovem(v_pedido.inscricao_id,'aprovar',v_pedido.patente);
  END IF;
 END IF;
 UPDATE public.fju_pedidos_patente_inicial
 SET status=CASE WHEN p_aprovar THEN 'aprovado' ELSE 'rejeitado' END,
 decidido_por=auth.uid(), decidido_em=now() WHERE id=v_pedido.id;
 RETURN v_jovem;
END; $$;

REVOKE ALL ON FUNCTION public.fju_solicitar_patente_inicial(uuid,text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fju_listar_pedidos_patente_inicial() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fju_decidir_patente_inicial(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fju_solicitar_patente_inicial(uuid,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_listar_pedidos_patente_inicial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fju_decidir_patente_inicial(uuid,boolean) TO authenticated;
