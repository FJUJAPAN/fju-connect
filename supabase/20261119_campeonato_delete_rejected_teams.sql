-- Remove rejected pending teams and their dependent player registration rows.
create or replace function public.fju_campeonato_excluir_time_rejeitado(p_time_id uuid)
returns boolean language plpgsql security definer set search_path=''
as $$
begin
 delete from public.fju_campeonatos_times t
 where t.id=p_time_id and t.status='pendente'
 and exists(select 1 from public.fju_campeonatos c where c.id=t.campeonato_id and private.fju_campeonato_staff(c.polo_sede_id));
 if not found then raise exception 'Time não encontrado, já analisado ou sem permissão.'; end if;
 return true;
end;
$$;
revoke all on function public.fju_campeonato_excluir_time_rejeitado(uuid) from public, anon;
grant execute on function public.fju_campeonato_excluir_time_rejeitado(uuid) to authenticated;
