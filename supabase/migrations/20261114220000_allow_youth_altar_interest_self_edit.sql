-- Persist the youth self-service "interest in serving at the altar" checkbox.
-- The column already exists; this extends the authenticated self-profile RPC allowlist and update.
do $$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'fju_salvar_meu_perfil';

  if position('deseja_obra_altar' in v_def) = 0 then
    v_def := replace(
      v_def,
      '''projetos'',''testemunho'',''observacoes''',
      '''projetos'',''testemunho'',''observacoes'',''deseja_obra_altar'''
    );

    v_def := replace(
      v_def,
      '    projetos=v_projects,',
      '    projetos=v_projects,' || chr(10) ||
      '    deseja_obra_altar=coalesce((p_dados->>''deseja_obra_altar'')::boolean,deseja_obra_altar),'
    );

    execute v_def;
  end if;
end $$;
