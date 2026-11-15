-- Add +20 points to every eligible task while the linked youth profile is 100% complete.
-- The weekly four-check-in bonus remains unchanged.

alter table public.fju_pontos_movimentos
  drop constraint if exists fju_pontos_movimentos_pontos_check;

alter table public.fju_pontos_movimentos
  add constraint fju_pontos_movimentos_pontos_check
  check (pontos = any (array[5,10,15,20,25,30,35,40,50]));

create or replace function public.fju_aplicar_bonus_perfil_completo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_jovem_id uuid;
  v_completo boolean := false;
begin
  -- The weekly 50-point bonus is a separate reward and is never multiplied.
  if new.tipo = 'bonus_4_checkins_semana' then
    return new;
  end if;

  -- Resolve the active youth ficha linked to this account.
  select j.id
    into v_jovem_id
  from public.fju_vinculos_conta_jovem v
  join public.fju_jovens j on j.id = v.jovem_id
  where v.usuario_id = new.usuario_id
    and v.ativo = true
    and j.excluido_em is null
  order by v.liberado_em desc nulls last
  limit 1;

  if v_jovem_id is null then
    return new;
  end if;

  select
    nullif(btrim(coalesce(j.nome_completo,'')),'') is not null
    and j.nascimento is not null
    and nullif(btrim(coalesce(j.telefone,'')),'') is not null
    and nullif(btrim(coalesce(j.nacionalidade_iso2,'')),'') is not null
    and nullif(btrim(coalesce(j.endereco,'')),'') is not null
    and j.estado_civil <> 'nao_informado'
    and cardinality(coalesce(j.idiomas,array[]::text[])) > 0
    and cardinality(coalesce(j.projetos,array[]::text[])) > 0
    and (
      j.batismo_aguas is not null
      or j.batismo_espirito_santo is not null
      or nullif(btrim(coalesce(c.dados->>'batismo_espirito','')),'') is not null
      or nullif(btrim(coalesce(c.dados->>'inicio_cpo','')),'') is not null
      or nullif(btrim(coalesce(c.dados->>'inicio_colaborador','')),'') is not null
      or nullif(btrim(coalesce(c.dados->>'inicio_obra','')),'') is not null
      or nullif(btrim(coalesce(c.dados->>'inicio_coordenacao_fju','')),'') is not null
    )
    and nullif(btrim(coalesce(j.testemunho,'')),'') is not null
    and exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'fju-fotos'
        and o.name = j.id::text || '/perfil.jpg'
        and o.archived_at is null
        and coalesce(o.is_delete_marker,false) = false
    )
  into v_completo
  from public.fju_jovens j
  left join public.fju_fichas_complementos c on c.jovem_id = j.id
  where j.id = v_jovem_id;

  if coalesce(v_completo,false) then
    new.pontos := new.pontos + 20;
  end if;

  return new;
end;
$function$;

drop trigger if exists fju_bonus_perfil_completo_pontos
  on public.fju_pontos_movimentos;

create trigger fju_bonus_perfil_completo_pontos
before insert on public.fju_pontos_movimentos
for each row
execute function public.fju_aplicar_bonus_perfil_completo();

revoke all on function public.fju_aplicar_bonus_perfil_completo() from public, anon, authenticated;
