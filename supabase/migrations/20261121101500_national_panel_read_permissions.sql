grant select on public.fju_campeonatos, public.fju_campeonatos_times, public.fju_campeonatos_jogadores, public.fju_polos to authenticated;
drop policy if exists campeonato_nacional_ler_eventos on public.fju_campeonatos;
create policy campeonato_nacional_ler_eventos on public.fju_campeonatos for select to authenticated using (public.fju_eh_nacional());
drop policy if exists campeonato_nacional_ler_times on public.fju_campeonatos_times;
create policy campeonato_nacional_ler_times on public.fju_campeonatos_times for select to authenticated using (public.fju_eh_nacional());
drop policy if exists campeonato_nacional_ler_jogadores on public.fju_campeonatos_jogadores;
create policy campeonato_nacional_ler_jogadores on public.fju_campeonatos_jogadores for select to authenticated using (public.fju_eh_nacional());
drop policy if exists fju_polos_nacional_ler on public.fju_polos;
create policy fju_polos_nacional_ler on public.fju_polos for select to authenticated using (public.fju_eh_nacional());