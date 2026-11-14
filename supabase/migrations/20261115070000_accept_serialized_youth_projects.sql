-- Accept the youth form's projects list whether PostgREST receives it as a JSON array
-- or as a JSON-encoded array string. All existing project allowlist and count checks remain.
do $$
declare
  v_def text;
  v_old text := 'if jsonb_typeof(p_dados->''projetos'') <> ''array'' then raise exception ''Formato de projetos inválido''; end if;';
  v_new text := $replacement$
if jsonb_typeof(p_dados->'projetos') = 'string' then
      begin
        p_dados := jsonb_set(p_dados, '{projetos}', (p_dados->>'projetos')::jsonb, false);
      exception when others then
        raise exception 'Formato de projetos inválido';
      end;
    end if;
    if jsonb_typeof(p_dados->'projetos') <> 'array' then raise exception 'Formato de projetos inválido'; end if;
$replacement$;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'fju_salvar_meu_perfil'
    and pg_get_function_identity_arguments(p.oid) = 'p_dados jsonb';

  if v_def is null then
    raise exception 'Função fju_salvar_meu_perfil(jsonb) não encontrada';
  end if;

  if position(v_old in v_def) > 0 then
    v_def := replace(v_def, v_old, v_new);
    execute v_def;
  elsif position('jsonb_set(p_dados, ''{projetos}''' in v_def) = 0 then
    raise exception 'Trecho esperado da validação de projetos não encontrado; nenhuma alteração aplicada';
  end if;
end $$;
