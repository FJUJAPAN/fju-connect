-- Captain is fully registered as a player in the same team-creation transaction.
create or replace function public.fju_campeonato_criar_time_v2(
 p_campeonato_id uuid,
 p_polo_id uuid,
 p_nome_time text,
 p_captain_hash text,
 p_captain_invite_hash text,
 p_nome_capitao text,
 p_captain_birth date,
 p_captain_city text,
 p_captain_photo_path text,
 p_consent boolean
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare
 v_id uuid;
 v_max integer;
 v_max_times integer;
 v_count integer;
begin
 if p_captain_hash !~ '^[a-f0-9]{64}$' or p_captain_invite_hash !~ '^[a-f0-9]{64}$' then raise exception 'Token inválido.'; end if;
 if char_length(btrim(p_nome_time)) not between 2 and 80 then raise exception 'Informe o nome do time (2 a 80 caracteres).'; end if;
 if char_length(btrim(p_nome_capitao)) not between 2 and 100 or p_captain_birth is null
   or p_captain_birth>current_date or p_captain_birth<date '1900-01-01'
   or char_length(btrim(p_captain_city)) not between 2 and 160 then raise exception 'Confira nome, data de nascimento e cidade/bairro do capitão.'; end if;
 if p_consent is distinct from true then raise exception 'Confirme a autorização para fornecer os dados.'; end if;
 if p_captain_photo_path is null or p_captain_photo_path<>p_captain_invite_hash||'/foto.jpg' then raise exception 'Foto obrigatória ou caminho inválido.'; end if;
 if not exists(select 1 from storage.objects where bucket_id='fju-campeonato-jogadores' and name=p_captain_photo_path) then raise exception 'A foto do capitão não foi enviada.'; end if;
 select max_jogadores_time,max_times into v_max,v_max_times from public.fju_campeonatos
 where id=p_campeonato_id and publicado=true and inscricoes_abertas=true and (prazo_inscricao is null or prazo_inscricao>=current_date) for update;
 if not found then raise exception 'Inscrições não estão abertas para este campeonato.'; end if;
 if v_max is not null and v_max<1 then raise exception 'Limite de jogadores inválido.'; end if;
 if v_max_times is not null then select count(*) into v_count from public.fju_campeonatos_times where campeonato_id=p_campeonato_id; if v_count>=v_max_times then raise exception 'Este campeonato atingiu o limite de equipes.'; end if; end if;
 if not exists(select 1 from public.fju_polos where id=p_polo_id and ativo=true) then raise exception 'Polo inválido.'; end if;
 insert into public.fju_campeonatos_times(campeonato_id,polo_id,nome_time,capitao_nome,token_capitao_hash)
 values(p_campeonato_id,p_polo_id,btrim(p_nome_time),btrim(p_nome_capitao),p_captain_hash) returning id into v_id;
 insert into public.fju_campeonatos_jogadores(time_id,token_inscricao_hash,nome,nascimento,cidade_bairro,foto_path,status,enviado_em,consent_confirmed_at)
 values(v_id,p_captain_invite_hash,btrim(p_nome_capitao),p_captain_birth,btrim(p_captain_city),p_captain_photo_path,'pendente',now(),now());
 return v_id;
end;
$$;
revoke all on function public.fju_campeonato_criar_time_v2(uuid,uuid,text,text,text,text,date,text,text,boolean) from public;
grant execute on function public.fju_campeonato_criar_time_v2(uuid,uuid,text,text,text,text,date,text,text,boolean) to anon,authenticated;
