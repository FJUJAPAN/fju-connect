-- FJU JAPAN | Validação server-side de proximidade para check-in.
-- Instalar após 20261025_checkin_locais_23_polos.sql.
-- Esta função NÃO registra presença nem libera locais não verificados.
BEGIN;
CREATE OR REPLACE FUNCTION public.fju_validar_proximidade_checkin(
 p_polo_slug text,
 p_latitude double precision,
 p_longitude double precision,
 p_precisao_m double precision
)
RETURNS TABLE(autorizado boolean, distancia_m integer, motivo text)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=''
AS $$
DECLARE
 v_local public.fju_checkin_locais%ROWTYPE;
 v_dist double precision;
BEGIN
 IF auth.uid() IS NULL THEN
   RETURN QUERY SELECT false,NULL::integer,'login_obrigatorio'::text; RETURN;
 END IF;
 IF p_latitude IS NULL OR p_longitude IS NULL OR p_precisao_m IS NULL
    OR NOT isfinite(p_latitude) OR NOT isfinite(p_longitude) OR NOT isfinite(p_precisao_m)
    OR p_latitude NOT BETWEEN -90 AND 90 OR p_longitude NOT BETWEEN -180 AND 180
    OR p_precisao_m <= 0 OR p_precisao_m > 50 THEN
   RETURN QUERY SELECT false,NULL::integer,'gps_impreciso'::text; RETURN;
 END IF;
 SELECT * INTO v_local FROM public.fju_checkin_locais
 WHERE slug=p_polo_slug AND verificado=true;
 IF NOT FOUND THEN
   RETURN QUERY SELECT false,NULL::integer,'polo_nao_verificado'::text; RETURN;
 END IF;
 v_dist := 6371000 * 2 * asin(least(1.0,sqrt(
    power(sin(radians(v_local.latitude-p_latitude)/2),2)
    + cos(radians(p_latitude))*cos(radians(v_local.latitude))
    *power(sin(radians(v_local.longitude-p_longitude)/2),2)
 )));
 -- Margem conservadora: distância estimada + incerteza GPS <= 100m.
 RETURN QUERY SELECT (v_dist+p_precisao_m<=100),
   round(v_dist)::integer,
   CASE WHEN v_dist+p_precisao_m<=100 THEN 'dentro_do_raio' ELSE 'fora_do_raio' END::text;
END;
$$;
REVOKE ALL ON FUNCTION public.fju_validar_proximidade_checkin(text,double precision,double precision,double precision) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.fju_validar_proximidade_checkin(text,double precision,double precision,double precision) TO authenticated;
COMMIT;
-- ATENÇÃO: coordenadas e precisão informadas pelo navegador podem ser falsificadas.
-- Esta função valida distância matemática, NÃO comprova presença física antifraude.
-- Não armazenar check-in definitivo apenas com esta função; exigir controles adicionais.
