alter table public.fju_campeonatos_times drop constraint if exists fju_campeonatos_times_campeonato_id_polo_id_nome_time_key;

create unique index fju_campeonatos_times_campeonato_polo_nome_active_key
on public.fju_campeonatos_times (campeonato_id, polo_id, nome_time)
where status <> 'rejeitado';
