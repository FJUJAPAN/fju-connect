-- Signup metadata is applicant input only; this trigger never grants access.
create schema if not exists fju_private;
revoke all on schema fju_private from public, anon, authenticated;

create or replace function fju_private.enqueue_confirmed_youth_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
 d jsonb;
 v_polo uuid;
 v_birth date;
 v_projects text[];
 v_name text;
 v_phone text;
 v_country text;
begin
 -- Use the Auth-managed confirmation field, never email_verified from metadata.
 if new.email_confirmed_at is null
    or new.raw_user_meta_data->>'signup_group' is distinct from 'FJU'
    or new.raw_user_meta_data->>'requested_role' = 'coordenador' then
   return new;
 end if;
 if exists(select 1 from public.fju_inscricoes_jovens where usuario_id=new.id)
    or exists(select 1 from public.fju_vinculos_conta_jovem where usuario_id=new.id)
    or exists(select 1 from public.fju_perfis where usuario_id=new.id and ativo and papel in ('nacional','coordenador')) then
   return new;
 end if;
 d := new.raw_user_meta_data->'signup_details';
 if jsonb_typeof(d) is distinct from 'object' then return new; end if;
 v_name := btrim(coalesce(d->>'name',''));
 v_phone := btrim(coalesce(d->>'phone',''));
 v_country := upper(btrim(coalesce(d->>'nationality','')));
 if char_length(v_name) not between 2 and 120
    or char_length(v_phone) not between 5 and 30
    or v_country !~ '^[A-Z]{2}$'
    or jsonb_typeof(d->'projects') is distinct from 'array' then return new; end if;
 begin
   v_polo := (d->>'polo')::uuid;
   v_birth := (d->>'birth')::date;
 exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
   return new;
 end;
 if v_polo is null or not exists(select 1 from public.fju_polos where id=v_polo)
    or v_birth is null or v_birth < date '1900-01-01' or v_birth > current_date then return new; end if;
 select coalesce(array_agg(x),'{}'::text[]) into v_projects from jsonb_array_elements_text(d->'projects') x;
 if cardinality(v_projects)>4 or array_position(v_projects,null) is not null
    or exists(select 1 from unnest(v_projects) x where x not in ('Esporte','Cultura','Mídia','Banda'))
    or (select count(distinct x) from unnest(v_projects) x)<>cardinality(v_projects) then return new; end if;
 insert into public.fju_inscricoes_jovens
   (usuario_id,polo_id,nome,projetos_solicitados,nascimento,telefone,nacionalidade_iso2,status)
 values(new.id,v_polo,v_name,v_projects,v_birth,v_phone,v_country,'pendente')
 on conflict(usuario_id) do nothing;
 return new;
end;
$$;
revoke all on function fju_private.enqueue_confirmed_youth_signup() from public,anon,authenticated;

create trigger fju_enqueue_confirmed_youth_signup
after insert or update of email_confirmed_at,raw_user_meta_data on auth.users
for each row execute function fju_private.enqueue_confirmed_youth_signup();
