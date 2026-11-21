-- Allow rejected teams to free their name for a corrected resubmission.
-- Keep names unique for every active/non-rejected team.
ALTER TABLE public.fju_campeonatos_times
  DROP CONSTRAINT IF EXISTS fju_campeonatos_times_campeonato_id_polo_id_nome_time_key;

CREATE UNIQUE INDEX IF NOT EXISTS fju_campeonatos_times_campeonato_polo_nome_active_key
  ON public.fju_campeonatos_times (campeonato_id, polo_id, nome_time)
  WHERE status <> 'rejeitado';
