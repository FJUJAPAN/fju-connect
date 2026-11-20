create or replace function public.fju_campeonato_times_publicos()
returns jsonb
language sql stable security definer set search_path=''
as $function$
select coalesce(jsonb_agg(
  jsonb_build_object(
    'time_id',t.id,
    'nome_time',t.nome_time,
    'capitao_nome',t.capitao_nome,
    'polo',p.nome,
    'campeonato_id',c.id,
    'campeonato',c.titulo,
    'modalidade',c.modalidade,
    'data',c.data_evento,
    'jogadores',(
      select coalesce(jsonb_agg(x.obj order by x.nome),'[]'::jsonb)
      from (
        select j.nome as nome,
               jsonb_build_object('nome',j.nome,'foto_path',coalesce(j.foto_path,f.foto_caminho)) as obj
        from public.fju_campeonatos_jogadores j
        left join public.fju_jovens f on f.id=j.jovem_id
        where j.time_id=t.id
          and j.status='aprovado'
          and j.consent_confirmed_at is not null
        union all
        select t.capitao_nome as nome,
               jsonb_build_object('nome',t.capitao_nome,'foto_path',null) as obj
        where t.capitao_nome is not null
          and not exists (
            select 1 from public.fju_campeonatos_jogadores j
            where j.time_id=t.id
              and j.status='aprovado'
              and j.consent_confirmed_at is not null
              and lower(trim(j.nome))=lower(trim(t.capitao_nome))
          )
      ) x
    )
  ) order by c.data_evento,t.nome_time),'[]'::jsonb)
from public.fju_campeonatos_times t
join public.fju_campeonatos c on c.id=t.campeonato_id
join public.fju_polos p on p.id=t.polo_id
where t.status='aprovado' and c.publicado=true
$function$;
