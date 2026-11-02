-- FJU CONNECT JAPAN: bonus automatico de +50 no quarto check-in valido da semana.
-- Semana: segunda 00:00 ate domingo 23:59:59, no horario Asia/Tokyo.
-- A recompensa ocorre no dia do quarto check-in, sem repetir na mesma semana.
-- Mantem o movimento original de check-in em 20 pontos.

ALTER TABLE public.fju_pontos_movimentos
  DROP CONSTRAINT fju_pontos_movimentos_pontos_check;
ALTER TABLE public.fju_pontos_movimentos
  ADD CONSTRAINT fju_pontos_movimentos_pontos_check
  CHECK (pontos = ANY (ARRAY[5,10,15,20,30,50]));

ALTER TABLE public.fju_pontos_movimentos
  DROP CONSTRAINT fju_pontos_movimentos_tipo_check;
ALTER TABLE public.fju_pontos_movimentos
  ADD CONSTRAINT fju_pontos_movimentos_tipo_check
  CHECK (tipo = ANY (ARRAY[
    'checkin',
    'comentario',
    'materia_publicada',
    'facebook_materia',
    'facebook_checkin',
    'atividade_limpeza_igreja',
    'atividade_evangelizacao',
    'atividade_alma_primeira',
    'atividade_alma_segunda_mes',
    'atividade_alma_terceira_mes',
    'bonus_4_checkins_semana'
  ]::text[]));

-- O indice protege contra repeticao mesmo em check-ins concorrentes.
-- A semana e calculada em data local de Tokyo (nao UTC).
CREATE UNIQUE INDEX IF NOT EXISTS fju_bonus_4_checkins_uma_vez_semana
  ON public.fju_pontos_movimentos (
    usuario_id,
    (date_trunc('week', ocorrido_em AT TIME ZONE 'Asia/Tokyo')::date)
  )
  WHERE tipo = 'bonus_4_checkins_semana';

CREATE OR REPLACE FUNCTION public.fju_creditar_bonus_4_checkins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fju$
DECLARE
  v_semana_inicio date := public.fju_semana_da_pontuacao(NEW.registrado_em);
  v_total integer;
BEGIN
  -- Serializa check-ins simultaneos para este usuario e semana.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'bonus4:' || NEW.usuario_id::text || ':' || v_semana_inicio::text, 0
    )
  );

  SELECT count(*)::integer INTO v_total
  FROM public.fju_checkin_presencas c
  WHERE c.usuario_id = NEW.usuario_id
    AND c.registrado_em >= (v_semana_inicio::timestamp AT TIME ZONE 'Asia/Tokyo')
    AND c.registrado_em < ((v_semana_inicio + 7)::timestamp AT TIME ZONE 'Asia/Tokyo');

  IF v_total >= 4 THEN
    INSERT INTO public.fju_pontos_movimentos
      (usuario_id, tipo, referencia_id, pontos, ocorrido_em)
    VALUES
      (NEW.usuario_id, 'bonus_4_checkins_semana', NEW.id, 50, NEW.registrado_em)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$fju$;

REVOKE ALL ON FUNCTION public.fju_creditar_bonus_4_checkins() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zz_fju_bonus_4_checkins ON public.fju_checkin_presencas;
CREATE TRIGGER zz_fju_bonus_4_checkins
AFTER INSERT ON public.fju_checkin_presencas
FOR EACH ROW
EXECUTE FUNCTION public.fju_creditar_bonus_4_checkins();
