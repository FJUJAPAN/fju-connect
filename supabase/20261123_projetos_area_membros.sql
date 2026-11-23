-- FJU CONNECT JAPAN | Área de Projetos (acesso por projeto da ficha)
-- Data: 23/11/2026
--
-- Regra decidida pela coordenação: quem tem o projeto marcado na própria ficha
-- (fju_jovens.projetos) acessa a área daquele projeto. O Nacional acessa todas,
-- para poder administrar os conteúdos.
--
-- Conteúdo futuro de um projeto (ex.: tutoriais da Mídia) deve usar
-- public.fju_tem_projeto('Mídia') nas políticas RLS e nas funções, para que o
-- bloqueio aconteça no banco e não só na tela.

begin;

-- 1) "Jiu-jitsu" e "FJU BJJ" são o mesmo projeto: unificar como 'FJU BJJ',
--    o valor que o perfil e o painel já usam.
update public.fju_jovens j
set projetos = (
  select array_agg(x.p order by x.pos)
  from (
    select distinct on (case when p = 'Jiu-jitsu' then 'FJU BJJ' else p end)
      case when p = 'Jiu-jitsu' then 'FJU BJJ' else p end as p, pos
    from unnest(j.projetos) with ordinality as u(p, pos)
    order by case when p = 'Jiu-jitsu' then 'FJU BJJ' else p end, pos
  ) x
)
where 'Jiu-jitsu' = any(j.projetos);

-- 2) Projetos da conta logada (lista vazia se não tiver ficha vinculada).
create or replace function public.fju_meus_projetos()
returns text[]
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select array_agg(distinct p order by p)
       from public.fju_vinculos_conta_jovem v
       join public.fju_jovens j on j.id = v.jovem_id
       cross join unnest(j.projetos) as p
      where v.usuario_id = (select auth.uid())
        and v.ativo = true
        and j.excluido_em is null),
    '{}'::text[]);
$$;

-- 3) Verificação usada pela página e, no futuro, pelas regras de cada conteúdo.
create or replace function public.fju_tem_projeto(p_projeto text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    p_projeto = any(public.fju_meus_projetos())
    or exists (
      select 1 from public.fju_perfis pf
      where pf.usuario_id = (select auth.uid()) and pf.ativo and pf.papel = 'nacional'
    )
  );
$$;

-- 4) Lista para a tela: todos os projetos com "tem acesso" sim/não.
create or replace function public.fju_projetos_acesso()
returns table(projeto text, acesso boolean)
language sql stable security definer set search_path = ''
as $$
  select c.p, public.fju_tem_projeto(c.p)
  from unnest(array['Mídia','Esporte','Cultura','HELP','FJU BJJ','Uniforça']) with ordinality as c(p, ord)
  order by c.ord;
$$;

revoke all on function public.fju_meus_projetos() from public, anon;
revoke all on function public.fju_tem_projeto(text) from public, anon;
revoke all on function public.fju_projetos_acesso() from public, anon;
grant execute on function public.fju_meus_projetos() to authenticated;
grant execute on function public.fju_tem_projeto(text) to authenticated;
grant execute on function public.fju_projetos_acesso() to authenticated;

commit;
