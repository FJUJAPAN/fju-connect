-- FJU Connect Japan | Campeonato: criação completa (capa, horários e limite de times).
-- Additive migration. Existing tournaments and registrations remain untouched.
begin;

alter table public.fju_campeonatos
  add column if not exists foto_capa_url text,
  add column if not exists hora_inicio time,
  add column if not exists hora_fim time,
  add column if not exists max_times integer;

do $ begin
  if not exists(select 1 from pg_constraint where conname='fju_campeonatos_max_times_check' and conrelid='public.fju_campeonatos'::regclass) then
    alter table public.fju_campeonatos add constraint fju_campeonatos_max_times_check check (max_times is null or max_times between 1 and 64);
  end if;
end $;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fju-campeonatos-capas','fju-campeonatos-capas',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists fju_campeonato_capa_public_read on storage.objects;
create policy fju_campeonato_capa_public_read on storage.objects
for select to public using (bucket_id='fju-campeonatos-capas');

drop policy if exists fju_campeonato_capa_staff_upload on storage.objects;
create policy fju_campeonato_capa_staff_upload on storage.objects
for insert to authenticated with check (
  bucket_id='fju-campeonatos-capas'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.fju_perfis p where p.usuario_id=(select auth.uid()) and p.ativo=true and p.papel in ('nacional','coordenador'))
);

drop policy if exists fju_campeonato_capa_staff_delete on storage.objects;
create policy fju_campeonato_capa_staff_delete on storage.objects
for delete to authenticated using (
  bucket_id='fju-campeonatos-capas'
  and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.fju_perfis p where p.usuario_id=(select auth.uid()) and p.ativo=true and p.papel in ('nacional','coordenador'))
);

grant select (foto_capa_url,hora_inicio,hora_fim,max_times) on public.fju_campeonatos to anon,authenticated;

create or replace function public.fju_campeonato_criar_v2(
  p_polo_sede_id uuid,
  p_titulo text,
  p_modalidade text,
  p_data_evento date,
  p_hora_inicio time,
  p_hora_fim time,
  p_local text,
  p_foto_capa_url text,
  p_descricao text default '',
  p_prazo date default null,
  p_max_jogadores integer default 12,
  p_max_times integer default null,
  p_publicado boolean default false,
  p_inscricoes_abertas boolean default false
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if auth.uid() is null or not private.fju_campeonato_staff(p_polo_sede_id) then
    raise exception 'Sem permissão para criar campeonato neste polo.';
  end if;
  if p_titulo is null or char_length(btrim(p_titulo)) not between 3 and 120
     or p_modalidade is null or char_length(btrim(p_modalidade)) not between 2 and 60 then
    raise exception 'Nome ou modalidade inválidos.';
  end if;
  if p_data_evento is null or p_data_evento < current_date then raise exception 'Data do campeonato inválida.'; end if;
  if p_hora_inicio is null or (p_hora_fim is not null and p_hora_fim<=p_hora_inicio) then raise exception 'Horário inválido.'; end if;
  if p_max_jogadores not between 2 and 30 then raise exception 'Limite de jogadores por time inválido.'; end if;
  if p_max_times is not null and p_max_times not between 1 and 64 then raise exception 'Limite de times inválido.'; end if;
  if p_local is null or char_length(btrim(p_local)) not between 2 and 200 then raise exception 'Local inválido.'; end if;
  if p_foto_capa_url is null or p_foto_capa_url !~ ('^https://hmacroktklgwkofxsygv[.]supabase[.]co/storage/v1/object/public/fju-campeonatos-capas/'||(select auth.uid())::text||'/') then
    raise exception 'Envie uma foto de capa válida.';
  end if;
  insert into public.fju_campeonatos(
    polo_sede_id,titulo,modalidade,data_evento,hora_inicio,hora_fim,local_evento,foto_capa_url,
    descricao,prazo_inscricao,max_jogadores_time,max_times,publicado,inscricoes_abertas,criado_por
  ) values (
    p_polo_sede_id,btrim(p_titulo),btrim(p_modalidade),p_data_evento,p_hora_inicio,p_hora_fim,
    btrim(p_local),p_foto_capa_url,coalesce(p_descricao,''),p_prazo,p_max_jogadores,p_max_times,
    coalesce(p_publicado,false),coalesce(p_inscricoes_abertas,false) and coalesce(p_publicado,false),auth.uid()
  ) returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.fju_campeonato_criar_v2(uuid,text,text,date,time,time,text,text,text,date,integer,integer,boolean,boolean) from public,anon;
grant execute on function public.fju_campeonato_criar_v2(uuid,text,text,date,time,time,text,text,text,date,integer,integer,boolean,boolean) to authenticated;

create or replace function public.fju_campeonato_criar_time(
  p_campeonato_id uuid, p_polo_id uuid, p_nome_time text, p_captain_hash text, p_captain_invite_hash text, p_nome_capitao text
) returns uuid language plpgsql security definer set search_path=''
as $
declare v_id uuid; v_max integer; v_max_times integer; v_count integer;
begin
  if p_captain_hash !~ '^[a-f0-9]{64}
 or p_captain_invite_hash !~ '^[a-f0-9]{64}
 then raise exception 'Token inválido.'; end if;
  select max_jogadores_time,max_times into v_max,v_max_times from public.fju_campeonatos
   where id=p_campeonato_id and publicado=true and inscricoes_abertas
   and (prazo_inscricao is null or prazo_inscricao>=current_date) for update;
  if v_max is null then raise exception 'Inscrições não estão abertas para este campeonato.'; end if;
  if v_max_times is not null then
    select count(*) into v_count from public.fju_campeonatos_times where campeonato_id=p_campeonato_id;
    if v_count>=v_max_times then raise exception 'Este campeonato atingiu o limite de equipes.'; end if;
  end if;
  if not exists(select 1 from public.fju_polos where id=p_polo_id and ativo=true) then raise exception 'Polo inválido.'; end if;
  insert into public.fju_campeonatos_times(campeonato_id,polo_id,nome_time,capitao_nome,token_capitao_hash)
  values(p_campeonato_id,p_polo_id,btrim(p_nome_time),btrim(p_nome_capitao),p_captain_hash) returning id into v_id;
  insert into public.fju_campeonatos_jogadores(time_id,token_inscricao_hash,nome,status)
  values(v_id,p_captain_invite_hash,btrim(p_nome_capitao),'convite');
  return v_id;
end; $;

commit;
