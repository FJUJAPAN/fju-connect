-- FJU JAPAN | Habilitar somente Hamamatsu para teste inicial de check-in.
-- Ponto de entrada confirmado pela coordenação: 34.7032527, 137.7415086.
-- Executar após a migração fju_checkin_locais_23_polos.sql.
BEGIN;
UPDATE public.fju_checkin_locais
SET verificado = true,
    atualizado_em = now()
WHERE slug = 'hamamatsu'
  AND latitude = 34.7032527
  AND longitude = 137.7415086;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.fju_checkin_locais
    WHERE slug='hamamatsu' AND verificado=true
  ) THEN
    RAISE EXCEPTION 'Hamamatsu não foi encontrado com as coordenadas esperadas';
  END IF;
END $$;
COMMIT;
-- Conferir:
-- SELECT slug,nome,latitude,longitude,verificado
-- FROM public.fju_checkin_locais WHERE slug='hamamatsu';
-- Para suspender o teste:
-- UPDATE public.fju_checkin_locais SET verificado=false,atualizado_em=now() WHERE slug='hamamatsu';
