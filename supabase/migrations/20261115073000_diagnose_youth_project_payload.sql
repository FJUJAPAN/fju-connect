-- Improve diagnostics for the youth profile projects payload without changing validation.
do $$
declare
  v_def text;
  v_old text := $old$if jsonb_typeof(p_dados->'projetos') <> 'array' then raise exception 'Formato de projetos inválido'; end if;$old$;
  v_new text := $new$if jsonb_typeof(p_dados->'projetos') <> 'array' then
      raise exception 'Formato de projetos inválido'
        using detail = format('tipo=%s; valor=%s', coalesce(jsonb_typeof(p_dados->'projetos'),'SQL NULL'), coalesce((p_dados->'projetos')::text,'SQL NULL'));
    end if;$new$;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'fju_salvar_meu_perfil'
    and pg_get_function_identity_arguments(p.oid) = 'p_dados jsonb';

  if v_def is null then raise exception 'Função fju_salvar_meu_perfil(jsonb) não encontrada'; end if;

  if position(v_old in v_def) > 0 then
    v_def := replace(v_def, v_old, v_new);
    execute v_def;
  elsif position('tipo=%s; valor=%s' in v_def) = 0 then
    raise exception 'Validação esperada não encontrada; nenhuma alteração aplicada';
  end if;
end $$;
