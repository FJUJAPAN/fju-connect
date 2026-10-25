-- FJU JAPAN | Corrigir ponto de check-in de Hamamatsu.
-- Coordenadas confirmadas pelo responsável por captura do pino do Google Maps.
-- Novo ponto: 34.7035345, 137.7412441.
-- Apenas Hamamatsu é alterada; raio de 100 metros permanece inalterado.
BEGIN;
UPDATE public.fju_checkin_locais
SET latitude = 34.7035345,
    longitude = 137.7412441
WHERE slug = 'hamamatsu';
-- Conferir a linha retornada antes de concluir.
SELECT slug, nome, latitude, longitude, verificado
FROM public.fju_checkin_locais
WHERE slug = 'hamamatsu';
COMMIT;
