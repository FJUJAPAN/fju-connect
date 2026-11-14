-- Normalize legacy string representations of the youth projects field.
-- Keep the project allowlist and maximum-count validation below this block unchanged.
do $$
declare
  v_def text;
  v_old text := $old$exception when others then
        raise exception 'Formato de projetos inválido';
      end;$old$;
  v_new text := $new$exception when others then
        -- Some older clients serialize the checkbox values as a comma-separated string.
        p_dados := jsonb_set(
          p_dados,
          '{projetos}',
          to_jsonb(array(
            select btrim(btrim(item), '"')
            from unnest(string_to_array(
              regexp_replace(coalesce(p_dados->>'projetos',''), '^\s*\[|\]\s*$', '', 'g'),
              ','
            )) as item
            where btrim(btrim(item), '"') <> ''
          )),
          false
        );
      end;$new$;
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
  elsif position('Some older clients serialize the checkbox values' in v_def) = 0 then
    raise exception 'Trecho esperado não encontrado; nenhuma alteração aplicada';
  end if;
end $$;
