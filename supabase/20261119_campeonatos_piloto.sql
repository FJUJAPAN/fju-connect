-- FJU Connect Japan | Campeonato piloto: times, links individuais e aprovação.
-- Non-destructive migration. Review and apply separately to Supabase before enabling registrations.
begin;

create schema if not exists private;

create table if not exists public.fju_campeonatos (
  id uuid primary key default gen_random_uuid(),
  polo_sede_id uuid not null references public.fju_polos(id),
  titulo text not null check (char_length(btrim(titulo)) between 3 and 120),
  modalidade text not null check (char_length(btrim(modalidade)) between 2 and 60),
  data_evento date not null,
  local_evento text not null check (char_length(btrim(local_evento)) between 2 and 200),
  descricao text not null default '' check (char_length(descricao) <= 2000),
  prazo_inscricao date,
  max_jogadores_time integer not null default 12 check (max_jogadores_time between 2 and 30),
  publicado boolean not null default false,
  inscricoes_abertas boolean not null default false,
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fju_campeonatos_times (
  id uuid primary key default gen_random_uuid(),
  campeonato_id uuid not null references public.fju_campeonatos(id) on delete cascade,
  polo_id uuid not null references public.fju_polos(id),
  nome_time text not null check (char_length(btrim(nome_time)) between 2 and 80),
  capitão_nome text not null check (char_length(btrim(capitão_nome)) between 2 and 100),
  token_capitao_hash text not null unique check (token_capitao_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  criado_em timestamptz not null default now(),
  unique (campeonato_id,polo_id,nome_time)
);

create table if not exists public.fju_campeonatos_jogadores (
  id uuid primary key default gen_random_uuid(),
  time_id uuid not null references public.fju_campeonatos_times(id) on delete cascade,
  token_inscricao_hash text not null unique check (token_inscricao_hash ~ '^[a-f0-9]{64}$'),
  nome text,
  nascimento date,
  cidade_bairro text,
  foto_path text,
  status text not null default 'convite' check (status in ('convite','pendente','aprovado','rejeitado')),
  enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint jogador_dados_validos check (
    (status='convite') or
    (nome is not null and char_length(btrim(nome)) between 2 and 100 and nascimento is not null and nascimento <= current_date and cidade_bairro is not null and char_length(btrim(cidade_bairro)) between 2 and 160)
  )
);

create index if not exists fju_campeonatos_data_idx on public.fju_campeonatos(data_evento);
create index if not exists fju_campeonatos_times_evento_idx on public.fju_campeonatos_times(campeonato_id);
create index if not exists fju_campeonatos_jogadores_time_idx on public.fju_campeonatos_jogadores(time_id);

create or replace function private.fju_campeonato_staff(p_sede_polo_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.fju_perfis p
    where p.usuario_id=(select auth.uid()) and p.ativo=true
      and (p.papel='nacional' or (p.papel='coordenador' and p.polo_id=p_sede_polo_id))
  );
$$;
revoke all on function private.fju_campeonato_staff(uuid) from public, anon;
grant execute on function private.fju_campeonato_staff(uuid) to authenticated;

alter table public.fju_campeonatos enable row level security;
alter table public.fju_campeonatos_times enable row level security;
alter table public.fju_campeonatos_jogadores enable row level security;

drop policy if exists campeonato_publico_listar on public.fju_campeonatos;
create policy campeonato_publico_listar on public.fju_campeonatos
for select to anon, authenticated using (publicado=true);

drop policy if exists campeonato_staff_listar on public.fju_campeonatos;
create policy campeonato_staff_listar on public.fju_campeonatos
for select to authenticated using (private.fju_campeonato_staff(polo_sede_id));

drop policy if exists campeonato_times_staff_select on public.fju_campeonatos_times;
create policy campeonato_times_staff_select on public.fju_campeonatos_times
for select to authenticated using (
  exists(select 1 from public.fju_campeonatos c where c.id=campeonato_id and private.fju_campeonato_staff(c.polo_sede_id))
);

drop policy if exists campeonato_jogadores_staff_select on public.fju_campeonatos_jogadores;
create policy campeonato_jogadores_staff_select on public.fju_campeonatos_jogadores
for select to authenticated using (
  exists(select 1 from public.fju_campeonatos_times t join public.fju_campeonatos c on c.id=t.campeonato_id
    where t.id=time_id and private.fju_campeonato_staff(c.polo_sede_id))
);

revoke all on public.fju_campeonatos, public.fju_campeonatos_times, public.fju_campeonatos_jogadores from public, anon, authenticated;
grant select on public.fju_campeonatos to anon, authenticated;
grant select on public.fju_campeonatos_times, public.fju_campeonatos_jogadores to authenticated;

create or replace function public.fju_campeonato_criar(
  p_polo_sede_id uuid, p_titulo text, p_modalidade text, p_data_evento date,
  p_local text, p_descricao text default '', p_prazo date default null,
  p_max_jogadores integer default 12, p_publicado boolean default false, p_inscricoes_abertas boolean default false
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if auth.uid() is null or not private.fju_campeonato_staff(p_polo_sede_id) then raise exception 'Sem permissão para criar campeonato neste polo.'; end if;
  if p_data_evento is null or p_data_evento < current_date then raise exception 'Data do campeonato inválida.'; end if;
  if p_max_jogadores not between 2 and 30 then raise exception 'Limite de jogadores inválido.'; end if;
  insert into public.fju_campeonatos(polo_sede_id,titulo,modalidade,data_evento,local_evento,descricao,prazo_inscricao,max_jogadores_time,publicado,inscricoes_abertas,criado_por)
  values(p_polo_sede_id,btrim(p_titulo),btrim(p_modalidade),p_data_evento,btrim(p_local),coalesce(p_descricao,''),p_prazo,p_max_jogadores,p_publicado,p_inscricoes_abertas,auth.uid())
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.fju_campeonato_atualizar(
  p_id uuid, p_publicado boolean, p_inscricoes_abertas boolean
) returns boolean language plpgsql security definer set search_path=''
as $$
begin
  update public.fju_campeonatos c set publicado=p_publicado,inscricoes_abertas=p_inscricoes_abertas,atualizado_em=now()
  where c.id=p_id and private.fju_campeonato_staff(c.polo_sede_id);
  if not found then raise exception 'Campeonato não encontrado ou sem permissão.'; end if;
  return true;
end; $$;

create or replace function public.fju_campeonato_criar_time(
  p_campeonato_id uuid, p_polo_id uuid, p_nome_time text, p_captain_hash text, p_captain_invite_hash text, p_nome_capitao text
) returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_max integer;
begin
  if p_captain_hash !~ '^[a-f0-9]{64}$' or p_captain_invite_hash !~ '^[a-f0-9]{64}$' then raise exception 'Token inválido.'; end if;
  select max_jogadores_time into v_max from public.fju_campeonatos
   where id=p_campeonato_id and publicado=true and inscricoes_abertas=true
   and (prazo_inscricao is null or prazo_inscricao>=current_date);
  if v_max is null then raise exception 'Inscrições não estão abertas para este campeonato.'; end if;
  if not exists(select 1 from public.fju_polos where id=p_polo_id and ativo=true) then raise exception 'Polo inválido.'; end if;
  insert into public.fju_campeonatos_times(campeonato_id,polo_id,nome_time,capitão_nome,token_capitao_hash)
  values(p_campeonato_id,p_polo_id,btrim(p_nome_time),btrim(p_nome_capitao),p_captain_hash) returning id into v_id;
  insert into public.fju_campeonatos_jogadores(time_id,token_inscricao_hash,nome,status)
  values(v_id,p_captain_invite_hash,btrim(p_nome_capitao),'convite');
  return v_id;
end; $$;

create or replace function public.fju_campeonato_criar_convite(p_captain_hash text,p_invite_hash text)
returns text language plpgsql security definer set search_path=''
as $$
declare v_time uuid; v_campeonato uuid; v_max integer; v_count integer;
begin
  if p_captain_hash !~ '^[a-f0-9]{64}$' or p_invite_hash !~ '^[a-f0-9]{64}$' then raise exception 'Link inválido.'; end if;
  select t.id,t.campeonato_id,c.max_jogadores_time into v_time,v_campeonato,v_max
  from public.fju_campeonatos_times t join public.fju_campeonatos c on c.id=t.campeonato_id
  where t.token_capitao_hash=p_captain_hash and t.status<>'rejeitado' and c.inscricoes_abertas and c.publicado and (c.prazo_inscricao is null or c.prazo_inscricao>=current_date);
  if v_time is null then raise exception 'Link do capitão inválido ou inscrições encerradas.'; end if;
  select count(*) into v_count from public.fju_campeonatos_jogadores where time_id=v_time;
  if v_count>=v_max then raise exception 'O time já atingiu o limite de jogadores.'; end if;
  insert into public.fju_campeonatos_jogadores(time_id,token_inscricao_hash,status) values(v_time,p_invite_hash,'convite');
  return p_invite_hash;
end; $$;

create or replace function public.fju_campeonato_time_por_token(p_captain_hash text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_result jsonb;
begin
  if p_captain_hash !~ '^[a-f0-9]{64}$' then return null; end if;
  select jsonb_build_object(
    'id',t.id,'nome',t.nome_time,'capitao',t.capitão_nome,'status',t.status,
    'evento',c.titulo,'modalidade',c.modalidade,'data',c.data_evento,'max',c.max_jogadores_time,
    'inscricoes_abertas',c.inscricoes_abertas,
    'jogadores',(select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'nome',j.nome,'status',j.status) order by j.criado_em),'[]'::jsonb) from public.fju_campeonatos_jogadores j where j.time_id=t.id)
  ) into v_result from public.fju_campeonatos_times t join public.fju_campeonatos c on c.id=t.campeonato_id
  where t.token_capitao_hash=p_captain_hash;
  return v_result;
end; $$;

create or replace function public.fju_campeonato_cadastrar_jogador(
  p_invite_hash text,p_nome text,p_nascimento date,p_cidade_bairro text,p_foto_path text
) returns boolean language plpgsql security definer set search_path=''
as $$
declare v_id uuid; v_time uuid;
begin
  if p_invite_hash !~ '^[a-f0-9]{64}$' then raise exception 'Convite inválido.'; end if;
  if char_length(btrim(p_nome)) not between 2 and 100 or p_nascimento is null or p_nascimento>current_date or p_cidade_bairro is null or char_length(btrim(p_cidade_bairro)) not between 2 and 160 then raise exception 'Preencha os campos obrigatórios corretamente.'; end if;
  if p_foto_path is not null and p_foto_path<>p_invite_hash||'/foto.jpg' then raise exception 'Caminho de foto inválido.'; end if;
  select j.id,j.time_id into v_id,v_time from public.fju_campeonatos_jogadores j join public.fju_campeonatos_times t on t.id=j.time_id join public.fju_campeonatos c on c.id=t.campeonato_id
  where j.token_inscricao_hash=p_invite_hash and j.status='convite' and c.inscricoes_abertas and c.publicado and (c.prazo_inscricao is null or c.prazo_inscricao>=current_date);
  if v_id is null then raise exception 'Convite já utilizado ou inscrição encerrada.'; end if;
  update public.fju_campeonatos_jogadores set nome=btrim(p_nome),nascimento=p_nascimento,cidade_bairro=btrim(p_cidade_bairro),foto_path=p_foto_path,status='pendente',enviado_em=now() where id=v_id;
  return true;
end; $$;

create or replace function public.fju_campeonato_aprovar_time(p_time_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if p_status not in ('aprovado','rejeitado') then raise exception 'Status inválido.'; end if;
 update public.fju_campeonatos_times t set status=p_status
 where t.id=p_time_id and exists(select 1 from public.fju_campeonatos c where c.id=t.campeonato_id and private.fju_campeonato_staff(c.polo_sede_id));
 if not found then raise exception 'Time não encontrado ou sem permissão.'; end if;
 return true;
end; $$;

create or replace function public.fju_campeonato_aprovar_jogador(p_jogador_id uuid,p_status text)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 if p_status not in ('aprovado','rejeitado') then raise exception 'Status inválido.'; end if;
 update public.fju_campeonatos_jogadores j set status=p_status
 where j.id=p_jogador_id and j.status='pendente' and exists(
  select 1 from public.fju_campeonatos_times t join public.fju_campeonatos c on c.id=t.campeonato_id
  where t.id=j.time_id and private.fju_campeonato_staff(c.polo_sede_id));
 if not found then raise exception 'Cadastro não encontrado, já analisado ou sem permissão.'; end if;
 return true;
end; $$;

revoke all on function public.fju_campeonato_criar(uuid,text,text,date,text,text,date,integer,boolean,boolean) from public,anon;
revoke all on function public.fju_campeonato_atualizar(uuid,boolean,boolean) from public,anon;
revoke all on function public.fju_campeonato_criar_time(uuid,uuid,text,text,text,text) from public;
revoke all on function public.fju_campeonato_criar_convite(text,text) from public;
revoke all on function public.fju_campeonato_time_por_token(text) from public;
revoke all on function public.fju_campeonato_cadastrar_jogador(text,text,date,text,text) from public;
revoke all on function public.fju_campeonato_aprovar_time(uuid,text) from public,anon;
revoke all on function public.fju_campeonato_aprovar_jogador(uuid,text) from public,anon;
grant execute on function public.fju_campeonato_criar(uuid,text,text,date,text,text,date,integer,boolean,boolean) to authenticated;
grant execute on function public.fju_campeonato_atualizar(uuid,boolean,boolean) to authenticated;
grant execute on function public.fju_campeonato_criar_time(uuid,uuid,text,text,text,text) to anon,authenticated;
grant execute on function public.fju_campeonato_criar_convite(text,text) to anon,authenticated;
grant execute on function public.fju_campeonato_time_por_token(text) to anon,authenticated;
grant execute on function public.fju_campeonato_cadastrar_jogador(text,text,date,text,text) to anon,authenticated;
grant execute on function public.fju_campeonato_aprovar_time(uuid,text) to authenticated;
grant execute on function public.fju_campeonato_aprovar_jogador(uuid,text) to authenticated;

-- Foto dos jogadores: bucket privado, upload anônimo apenas com convite válido.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fju-campeonato-jogadores','fju-campeonato-jogadores',false,3145728,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=3145728,allowed_mime_types=array['image/jpeg'];

drop policy if exists campeonato_foto_upload_por_convite on storage.objects;
create policy campeonato_foto_upload_por_convite on storage.objects for insert to anon,authenticated
with check (
 bucket_id='fju-campeonato-jogadores' and name ~ '^[a-f0-9]{64}/foto\.jpg$'
 and exists(select 1 from public.fju_campeonatos_jogadores j where j.token_inscricao_hash=split_part(name,'/',1) and j.status='convite')
);

drop policy if exists campeonato_foto_staff_ler on storage.objects;
create policy campeonato_foto_staff_ler on storage.objects for select to authenticated
using (
 bucket_id='fju-campeonato-jogadores' and exists(
  select 1 from public.fju_campeonatos_jogadores j join public.fju_campeonatos_times t on t.id=j.time_id join public.fju_campeonatos c on c.id=t.campeonato_id
  where j.token_inscricao_hash=split_part(name,'/',1) and private.fju_campeonato_staff(c.polo_sede_id)
 )
);

commit;
