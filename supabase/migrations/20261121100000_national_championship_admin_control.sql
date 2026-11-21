create schema if not exists campeonato_archive;

create table if not exists campeonato_archive.admin_deleted_records (
 id bigint generated always as identity primary key,
 record_type text not null,
 record_id uuid not null,
 snapshot jsonb not null,
 deleted_by uuid not null,
 deleted_at timestamptz not null default now(),
 reason text
);
revoke all on campeonato_archive.admin_deleted_records from public,anon,authenticated;

create table if not exists public.fju_campeonato_admin_audit (
 id bigint generated always as identity primary key,
 actor uuid not null,
 action text not null,
 entity_type text not null,
 entity_id uuid not null,
 before_data jsonb,
 after_data jsonb,
 created_at timestamptz not null default now()
);
alter table public.fju_campeonato_admin_audit enable row level security;
revoke all on public.fju_campeonato_admin_audit from public,anon,authenticated;

create or replace function private.fju_campeonato_nacional()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.fju_perfis p where p.usuario_id=auth.uid() and p.ativo=true and p.papel='nacional'); $$;

create or replace function public.fju_campeonato_admin_editar_time(p_id uuid,p_nome text,p_polo_id uuid,p_capitao text,p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_before jsonb;
begin
 if not private.fju_campeonato_nacional() then raise exception 'Somente Nacional pode editar times.'; end if;
 if length(trim(p_nome)) not between 2 and 80 or length(trim(p_capitao)) not between 2 and 100 or p_status not in ('pendente','aprovado','rejeitado') then raise exception 'Dados inválidos.'; end if;
 select to_jsonb(t) into v_before from public.fju_campeonato_times t where t.id=p_id;
 if v_before is null then raise exception 'Time não encontrado.'; end if;
 update public.fju_campeonato_times set nome_time=trim(p_nome),polo_id=p_polo_id,capitao_nome=trim(p_capitao),status=p_status where id=p_id;
 insert into public.fju_campeonato_admin_audit(actor,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'edit','team',p_id,v_before,(select to_jsonb(t) from public.fju_campeonato_times t where t.id=p_id));
 return true;
end $$;

create or replace function public.fju_campeonato_admin_editar_jogador(p_id uuid,p_nome text,p_nascimento date,p_cidade text,p_fju_numero bigint,p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_before jsonb;
begin
 if not private.fju_campeonato_nacional() then raise exception 'Somente Nacional pode editar atletas.'; end if;
 if length(trim(p_nome)) not between 2 and 100 or p_nascimento is null or p_nascimento>current_date or length(trim(p_cidade)) not between 2 and 160 or p_status not in ('convite','pendente','aprovado','rejeitado') then raise exception 'Dados inválidos.'; end if;
 select to_jsonb(j) into v_before from public.fju_campeonatos_jogadores j where j.id=p_id;
 if v_before is null then raise exception 'Atleta não encontrado.'; end if;
 update public.fju_campeonatos_jogadores set nome=trim(p_nome),nascimento=p_nascimento,cidade_bairro=trim(p_cidade),fju_numero=p_fju_numero,status=p_status where id=p_id;
 insert into public.fju_campeonato_admin_audit(actor,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'edit','player',p_id,v_before,(select to_jsonb(j) from public.fju_campeonatos_jogadores j where j.id=p_id));
 return true;
end $$;

create or replace function public.fju_campeonato_admin_editar_evento(p_id uuid,p_titulo text,p_modalidade text,p_data date,p_inicio time,p_fim time,p_local text,p_polo uuid,p_descricao text,p_prazo date,p_max_jogadores integer,p_max_times integer,p_publicado boolean,p_aberto boolean)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_before jsonb;
begin
 if not private.fju_campeonato_nacional() then raise exception 'Somente Nacional pode editar campeonatos.'; end if;
 if length(trim(p_titulo)) not between 2 and 120 or length(trim(p_modalidade)) not between 2 and 60 or p_data is null or length(trim(p_local)) not between 2 and 200 or p_max_jogadores not between 2 and 30 or (p_max_times is not null and p_max_times not between 1 and 64) or (p_prazo is not null and p_prazo>p_data) or (p_fim is not null and p_inicio is not null and p_fim<=p_inicio) then raise exception 'Dados inválidos.'; end if;
 select to_jsonb(c) into v_before from public.fju_campeonatos c where c.id=p_id;
 if v_before is null then raise exception 'Campeonato não encontrado.'; end if;
 update public.fju_campeonatos set titulo=trim(p_titulo),modalidade=trim(p_modalidade),data_evento=p_data,hora_inicio=p_inicio,hora_fim=p_fim,local_evento=trim(p_local),polo_sede_id=p_polo,descricao=coalesce(p_descricao,''),prazo_inscricao=p_prazo,max_jogadores_time=p_max_jogadores,max_times=p_max_times,publicado=p_publicado,inscricoes_abertas=p_aberto,atualizado_em=now() where id=p_id;
 insert into public.fju_campeonato_admin_audit(actor,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'edit','event',p_id,v_before,(select to_jsonb(c) from public.fju_campeonatos c where c.id=p_id));
 return true;
end $$;

create or replace function public.fju_campeonato_admin_excluir(p_tipo text,p_id uuid,p_motivo text default null)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_snap jsonb;
begin
 if not private.fju_campeonato_nacional() then raise exception 'Somente Nacional pode excluir registros.'; end if;
 if p_tipo='player' then
  select to_jsonb(j) into v_snap from public.fju_campeonatos_jogadores j where j.id=p_id;
  if v_snap is null then raise exception 'Atleta não encontrado.'; end if;
  insert into campeonato_archive.admin_deleted_records(record_type,record_id,snapshot,deleted_by,reason) values('player',p_id,v_snap,auth.uid(),p_motivo);
  delete from public.fju_campeonatos_jogadores where id=p_id;
 elsif p_tipo='team' then
  select jsonb_build_object('team',to_jsonb(t),'players',coalesce((select jsonb_agg(to_jsonb(j)) from public.fju_campeonatos_jogadores j where j.time_id=t.id),'[]'::jsonb)) into v_snap from public.fju_campeonato_times t where t.id=p_id;
  if v_snap is null then raise exception 'Time não encontrado.'; end if;
  insert into campeonato_archive.admin_deleted_records(record_type,record_id,snapshot,deleted_by,reason) values('team',p_id,v_snap,auth.uid(),p_motivo);
  delete from public.fju_campeonatos_jogadores where time_id=p_id;
  delete from public.fju_campeonato_times where id=p_id;
 elsif p_tipo='event' then
  select jsonb_build_object('event',to_jsonb(c),'teams',coalesce((select jsonb_agg(to_jsonb(t)) from public.fju_campeonato_times t where t.campeonato_id=c.id),'[]'::jsonb),'players',coalesce((select jsonb_agg(to_jsonb(j)) from public.fju_campeonatos_jogadores j join public.fju_campeonato_times t on t.id=j.time_id where t.campeonato_id=c.id),'[]'::jsonb)) into v_snap from public.fju_campeonatos c where c.id=p_id;
  if v_snap is null then raise exception 'Campeonato não encontrado.'; end if;
  insert into campeonato_archive.admin_deleted_records(record_type,record_id,snapshot,deleted_by,reason) values('event',p_id,v_snap,auth.uid(),p_motivo);
  delete from public.fju_campeonatos_jogadores where time_id in (select id from public.fju_campeonato_times where campeonato_id=p_id);
  delete from public.fju_campeonato_times where campeonato_id=p_id;
  delete from public.fju_campeonatos where id=p_id;
 else raise exception 'Tipo inválido.'; end if;
 insert into public.fju_campeonato_admin_audit(actor,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'delete',p_tipo,p_id,v_snap,null);
 return true;
end $$;

create or replace function public.fju_campeonato_admin_audit_list(p_limit integer default 100)
returns table(id bigint,actor uuid,action text,entity_type text,entity_id uuid,before_data jsonb,after_data jsonb,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
 if not private.fju_campeonato_nacional() then raise exception 'Acesso Nacional somente.'; end if;
 return query select a.id,a.actor,a.action,a.entity_type,a.entity_id,a.before_data,a.after_data,a.created_at from public.fju_campeonato_admin_audit a order by a.created_at desc limit least(greatest(coalesce(p_limit,100),1),500);
end $$;

revoke all on function public.fju_campeonato_admin_editar_time(uuid,text,uuid,text,text) from public,anon;
revoke all on function public.fju_campeonato_admin_editar_jogador(uuid,text,date,text,bigint,text) from public,anon;
revoke all on function public.fju_campeonato_admin_editar_evento(uuid,text,text,date,time,time,text,uuid,text,date,integer,integer,boolean,boolean) from public,anon;
revoke all on function public.fju_campeonato_admin_excluir(text,uuid,text) from public,anon;
revoke all on function public.fju_campeonato_admin_audit_list(integer) from public,anon;
grant execute on function public.fju_campeonato_admin_editar_time(uuid,text,uuid,text,text) to authenticated;
grant execute on function public.fju_campeonato_admin_editar_jogador(uuid,text,date,text,bigint,text) to authenticated;
grant execute on function public.fju_campeonato_admin_editar_evento(uuid,text,text,date,time,time,text,uuid,text,date,integer,integer,boolean,boolean) to authenticated;
grant execute on function public.fju_campeonato_admin_excluir(text,uuid,text) to authenticated;
grant execute on function public.fju_campeonato_admin_audit_list(integer) to authenticated;
