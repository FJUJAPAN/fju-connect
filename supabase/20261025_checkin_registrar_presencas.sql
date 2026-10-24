-- FJU JAPAN | Registro de check-in autenticado, após validar polos.
-- Pré-requisitos: 20261025_checkin_locais_23_polos.sql e
-- 20261025_checkin_validacao_raio_100m.sql.
BEGIN;
CREATE TABLE IF NOT EXISTS public.fju_checkin_presencas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 polo_slug text NOT NULL REFERENCES public.fju_checkin_locais(slug),
 distancia_m integer NOT NULL CHECK (distancia_m BETWEEN 0 AND 100),
 precisao_m double precision NOT NULL CHECK (precisao_m > 0 AND precisao_m <= 50),
 registrado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fju_checkin_presencas_usuario_data
 ON public.fju_checkin_presencas(usuario_id,registrado_em DESC);
CREATE UNIQUE INDEX IF NOT EXISTS fju_checkin_uma_vez_por_dia_polo
 ON public.fju_checkin_presencas(usuario_id,polo_slug,((registrado_em AT TIME ZONE 'Asia/Tokyo')::date));
ALTER TABLE public.fju_checkin_presencas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fju_checkin_presencas FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.fju_checkin_presencas TO authenticated;
DROP POLICY IF EXISTS fju_checkin_ler_proprios ON public.fju_checkin_presencas;
CREATE POLICY fju_checkin_ler_proprios ON public.fju_checkin_presencas
 FOR SELECT TO authenticated USING(usuario_id=(select auth.uid()));
CREATE OR REPLACE FUNCTION public.fju_registrar_checkin(
 p_polo_slug text,p_latitude double precision,p_longitude double precision,p_precisao_m double precision
) RETURNS TABLE(id uuid,polo_slug text,registrado_em timestamptz,distancia_m integer)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_ok boolean;v_dist integer;v_motivo text;v_id uuid;v_data timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login_obrigatorio'; END IF;
 SELECT v.autorizado,v.distancia_m,v.motivo INTO v_ok,v_dist,v_motivo
 FROM public.fju_validar_proximidade_checkin(p_polo_slug,p_latitude,p_longitude,p_precisao_m) v;
 IF v_ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'checkin_bloqueado: %',coalesce(v_motivo,'erro'); END IF;
 INSERT INTO public.fju_checkin_presencas(usuario_id,polo_slug,distancia_m,precisao_m)
 VALUES(auth.uid(),p_polo_slug,v_dist,p_precisao_m)
 RETURNING fju_checkin_presencas.id,fju_checkin_presencas.registrado_em INTO v_id,v_data;
 RETURN QUERY SELECT v_id,p_polo_slug,v_data,v_dist;
EXCEPTION WHEN unique_violation THEN
 RAISE EXCEPTION 'checkin_ja_registrado_hoje';
END;
$$;
REVOKE ALL ON FUNCTION public.fju_registrar_checkin(text,double precision,double precision,double precision) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fju_registrar_checkin(text,double precision,double precision,double precision) TO authenticated;
COMMIT;
-- Aviso: GPS de navegador pode ser falsificado. Este controle não prova
-- presença física contra usuário malicioso. Não usar para auditoria rigorosa.
