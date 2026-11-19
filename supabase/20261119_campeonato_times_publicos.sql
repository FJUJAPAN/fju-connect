-- Public directory: only approved teams and approved players; no private player data/photos exposed.
create or replace function public.fju_campeonato_times_publicos()
returns jsonb language sql stable security definer set search_path=''
as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'time_id',t.id,'nome_time',t.nome_time,'polo',p.nome,
   'campeonato_id',c.id,'campeonato',c.titulo,'modalidade',c.modalidade,'data',c.data_evento,
   'jogadores',(select coalesce(jsonb_agg(jsonb_build_object('nome',j.nome) order by j.nome),'[]'::jsonb)
     from public.fju_campeonatos_jogadores j where j.time_id=t.id and j.status='aprovado')
 ) order by c.data_evento,t.nome_time),'[]'::jsonb)
 from public.fju_campeonatos_times t
 join public.fju_campeonatos c on c.id=t.campeonato_id
 join public.fju_polos p on p.id=t.polo_id
 where t.status='aprovado' and c.publicado=true
$$;
revoke all on function public.fju_campeonato_times_publicos() from public;
grant execute on function public.fju_campeonato_times_publicos() to anon,authenticated;
