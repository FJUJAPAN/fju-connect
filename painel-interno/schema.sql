-- FJU CONNECT JAPAN | Estrutura do painel interno
-- Execute no SQL Editor de um projeto Supabase NOVO.
-- Nunca cole a chave service_role no GitHub, no navegador ou nesta pagina.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.fju_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null check(role in ('admin','coordinator')),
  polo text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint staff_role_polo check (
    (role='admin' and polo is null) or (role='coordinator' and polo is not null)
  ),
  constraint staff_polo_known check (
    polo is null or polo in (
      'Hamamatsu','Toyohashi','Suzuka','Iwata','Yaizu','Fuji','Anjo','Shiga',
      'Nagahama','Kani','Toyota','Nagoya','Komaki','Takaoka','Kanagawa',
      'Yamanashi','Nagano','Chiba','Gunma','Ibaraki','Isesaki','Tokyo','Ryuzenji'
    )
  )
);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (select 1 from public.fju_staff s
 where s.user_id=auth.uid() and s.active and s.role='admin');
$$;

create or replace function private.can_access_polo(p text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (select 1 from public.fju_staff s
 where s.user_id=auth.uid() and s.active
 and (s.role='admin' or (s.role='coordinator' and s.polo=p)));
$$;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.can_access_polo(text) from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_access_polo(text) to authenticated;

alter table public.fju_staff enable row level security;
drop policy if exists staff_select on public.fju_staff;
create policy staff_select on public.fju_staff for select to authenticated
using (user_id=auth.uid() or (select private.is_admin()));
-- O cadastro de usuarios e a atribuicao de polo ficam restritos ao painel
-- administrativo do Supabase na primeira fase: sem escrita client-side.
revoke all on public.fju_staff from public, anon, authenticated;
grant select on public.fju_staff to authenticated;

create table if not exists public.fju_youth (
  id uuid primary key default gen_random_uuid(),
  polo text not null check(polo in (
    'Hamamatsu','Toyohashi','Suzuka','Iwata','Yaizu','Fuji','Anjo','Shiga',
    'Nagahama','Kani','Toyota','Nagoya','Komaki','Takaoka','Kanagawa',
    'Yamanashi','Nagano','Chiba','Gunma','Ibaraki','Isesaki','Tokyo','Ryuzenji'
  )),
  stage text not null default 'Inconstante'
    check(stage in ('Inconstante','Firme','CPO','Colaborador','Obreiro','Coordenador')),
  full_name text not null default '',
  nationality text not null default 'JP'
    check(nationality ~ '^[A-Z]{2,5}$'),
  languages text not null default '',
  phone text not null default '',
  address text not null default '',
  date_of_birth date,
  joined_at date,
  water_baptism date,
  spirit_baptism date,
  testimony text not null default '',
  photo_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fju_youth_polo_stage_idx on public.fju_youth(polo,stage);
create index if not exists fju_youth_updated_idx on public.fju_youth(updated_at desc);

create or replace function public.fju_touch_updated_at()
returns trigger language plpgsql set search_path=''
as $$ begin new.updated_at=now();return new;end;$$;
drop trigger if exists fju_youth_updated_trigger on public.fju_youth;
create trigger fju_youth_updated_trigger before update on public.fju_youth
for each row execute function public.fju_touch_updated_at();

alter table public.fju_youth enable row level security;
drop policy if exists youth_select on public.fju_youth;
drop policy if exists youth_insert on public.fju_youth;
drop policy if exists youth_update on public.fju_youth;
drop policy if exists youth_delete on public.fju_youth;
create policy youth_select on public.fju_youth for select to authenticated
 using ((select private.can_access_polo(polo)));
create policy youth_insert on public.fju_youth for insert to authenticated
 with check ((select private.can_access_polo(polo)));
create policy youth_update on public.fju_youth for update to authenticated
 using ((select private.can_access_polo(polo)))
 with check ((select private.can_access_polo(polo)));
create policy youth_delete on public.fju_youth for delete to authenticated
 using ((select private.can_access_polo(polo)));
revoke all on public.fju_youth from public, anon, authenticated;
grant select, insert, update, delete on public.fju_youth to authenticated;

create table if not exists public.fju_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  polo text not null check(polo in (
    'Hamamatsu','Toyohashi','Suzuka','Iwata','Yaizu','Fuji','Anjo','Shiga',
    'Nagahama','Kani','Toyota','Nagoya','Komaki','Takaoka','Kanagawa',
    'Yamanashi','Nagano','Chiba','Gunma','Ibaraki','Isesaki','Tokyo','Ryuzenji'
  )),
  week_ending date not null check(extract(isodow from week_ending)=7),
  firmes integer not null default 0 check(firmes>=0),
  novos integer not null default 0 check(novos>=0),
  afastados integer not null default 0 check(afastados>=0),
  domingo integer not null default 0 check(domingo>=0),
  encontro integer not null default 0 check(encontro>=0),
  unicos integer not null default 0 check(unicos>=0),
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz not null default now(),
  status text not null default 'late' check(status in ('on_time','late')),
  unique(polo,week_ending)
);

create or replace function public.fju_set_submission()
returns trigger language plpgsql set search_path=''
as $$
declare submitted_jst timestamp;
begin
  new.submitted_at=clock_timestamp();
  new.submitted_by=auth.uid();
  submitted_jst=new.submitted_at at time zone 'Asia/Tokyo';
  if submitted_jst <= (new.week_ending::timestamp + interval '22 hours') then
    new.status='on_time';
  else
    new.status='late';
  end if;
  return new;
end;
$$;
drop trigger if exists fju_weekly_submission_trigger on public.fju_weekly_reports;
create trigger fju_weekly_submission_trigger
before insert or update on public.fju_weekly_reports
for each row execute function public.fju_set_submission();

alter table public.fju_weekly_reports enable row level security;
drop policy if exists weekly_select on public.fju_weekly_reports;
drop policy if exists weekly_insert on public.fju_weekly_reports;
drop policy if exists weekly_update on public.fju_weekly_reports;
create policy weekly_select on public.fju_weekly_reports for select to authenticated
 using ((select private.can_access_polo(polo)));
create policy weekly_insert on public.fju_weekly_reports for insert to authenticated
 with check ((select private.can_access_polo(polo)));
create policy weekly_update on public.fju_weekly_reports for update to authenticated
 using ((select private.can_access_polo(polo)))
 with check ((select private.can_access_polo(polo)));
revoke all on public.fju_weekly_reports from public, anon, authenticated;
grant select on public.fju_weekly_reports to authenticated;
grant insert (polo,week_ending,firmes,novos,afastados,domingo,encontro,unicos)
 on public.fju_weekly_reports to authenticated;
grant update (firmes,novos,afastados,domingo,encontro,unicos)
 on public.fju_weekly_reports to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('fju-youth-photos','fju-youth-photos',false,2097152,
  array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=2097152,
 allowed_mime_types=excluded.allowed_mime_types;

-- Caminho: <polo>/<uuid-do-jovem>/<arquivo>.jpg
-- As politicas abaixo validam o jovem, e NAO apenas o nome do polo.
create or replace function private.can_access_photo_path(path text, require_same_polo boolean)
returns boolean language plpgsql stable security definer set search_path=''
as $$
declare
 parts text[];
 youth_polo text;
begin
 parts=storage.foldername(path);
 if coalesce(array_length(parts,1),0)<>2 then return false;end if;
 if parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
 then return false;end if;
 select y.polo into youth_polo from public.fju_youth y
 where y.id=parts[2]::uuid;
 if youth_polo is null then return false;end if;
 return (not require_same_polo or parts[1]=youth_polo)
    and private.can_access_polo(youth_polo);
end;
$$;
revoke all on function private.can_access_photo_path(text,boolean) from public,anon;
grant execute on function private.can_access_photo_path(text,boolean) to authenticated;

drop policy if exists fju_photos_read on storage.objects;
drop policy if exists fju_photos_insert on storage.objects;
drop policy if exists fju_photos_delete on storage.objects;
create policy fju_photos_read on storage.objects for select to authenticated
 using(bucket_id='fju-youth-photos' and private.can_access_photo_path(name,false));
create policy fju_photos_insert on storage.objects for insert to authenticated
 with check(bucket_id='fju-youth-photos' and private.can_access_photo_path(name,true));
create policy fju_photos_delete on storage.objects for delete to authenticated
 using(bucket_id='fju-youth-photos' and private.can_access_photo_path(name,false));
commit;

-- CADASTRO DO PRIMEIRO ADMINISTRADOR (execute separadamente apos criar o usuario
-- manualmente em Supabase > Authentication > Users):
--
-- insert into public.fju_staff(user_id,display_name,role,polo)
-- select id,'Administrador Nacional','admin',null
-- from auth.users where email='SEU_EMAIL_AQUI';
--
-- COORDENADOR LOCAL (o usuario tambem precisa existir em Authentication > Users):
--
-- insert into public.fju_staff(user_id,display_name,role,polo)
-- select id,'Coordenador Hamamatsu','coordinator','Hamamatsu'
-- from auth.users where email='EMAIL_COORDENADOR_AQUI';
