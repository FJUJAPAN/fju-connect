CREATE OR REPLACE FUNCTION public.fju_salvar_meu_perfil(p_dados jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_j public.fju_jovens%rowtype;
  v_projects text[];
  v_languages text[];
  v_extra jsonb;
  v_key text;
  v_date text;
  v_allowed text[] := array[
    'nome_completo','telefone','nacionalidade_iso2','idiomas',
    'nascimento','estado_civil','data_casamento','endereco',
    'batismo_aguas','batismo_espirito_santo','batismo_espirito',
    'inicio_cpo','inicio_colaborador','inicio_obra','inicio_coordenacao_fju',
    'projetos','testemunho','observacoes','deseja_obra_altar'
  ];
  v_allowed_languages text[] := array[
    'Português','Japonês','Inglês','Espanhol','Tagalog','Hindi','Nepali',
    'Indonésio','Birmanês','Cingalês','Coreano','Chinês','Vietnamita',
    'Tailandês','Outros'
  ];
begin
  if v_uid is null then raise exception 'Login necessário'; end if;
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' then raise exception 'Dados inválidos'; end if;

  for v_key in select jsonb_object_keys(p_dados) loop
    if not (v_key = any(v_allowed)) then raise exception 'Campo não permitido: %', v_key; end if;
  end loop;

  select j.* into v_j
  from public.fju_jovens j
  join public.fju_vinculos_conta_jovem v on v.jovem_id = j.id
  where v.usuario_id = v_uid and v.ativo = true and j.excluido_em is null
  order by v.liberado_em desc nulls last
  limit 1 for update of j;
  if not found then raise exception 'Ficha vinculada não encontrada'; end if;

  if p_dados ? 'nome_completo' and
     (length(btrim(coalesce(p_dados->>'nome_completo',''))) = 0 or length(p_dados->>'nome_completo') > 180) then
    raise exception 'Nome completo inválido';
  end if;
  if length(coalesce(p_dados->>'telefone','')) > 50 then raise exception 'Telefone excede o limite permitido'; end if;
  if p_dados ? 'nacionalidade_iso2' and nullif(btrim(p_dados->>'nacionalidade_iso2'),'') is not null
     and btrim(p_dados->>'nacionalidade_iso2') !~ '^[A-Z]{2}$' then
    raise exception 'Nacionalidade inválida';
  end if;

  if p_dados ? 'projetos' then
    if jsonb_typeof(p_dados->'projetos') <> 'array' then raise exception 'Formato de projetos inválido'; end if;
    select coalesce(array_agg(distinct btrim(value)) filter(where btrim(value)<>''), array[]::text[])
      into v_projects
    from jsonb_array_elements_text(p_dados->'projetos') as e(value);
    if cardinality(v_projects) > 5 then raise exception 'Máximo de 5 projetos'; end if;
    if exists (
      select 1 from unnest(v_projects) as p(value)
      where p.value <> all(array['HELP','Cultura','Esporte','Mídia','FJU BJJ','Uniforça'])
    ) then raise exception 'Projeto inválido'; end if;
  else
    v_projects := v_j.projetos;
  end if;

  if p_dados ? 'idiomas' then
    if jsonb_typeof(p_dados->'idiomas') <> 'array' then raise exception 'Formato de idiomas inválido'; end if;
    select coalesce(array_agg(distinct btrim(value)) filter(where btrim(value)<>''), array[]::text[])
      into v_languages
    from jsonb_array_elements_text(p_dados->'idiomas') as e(value);
    if cardinality(v_languages) > 15 or exists (
      select 1 from unnest(v_languages) as l(value)
      where l.value <> all(v_allowed_languages)
    ) then raise exception 'Lista de idiomas inválida'; end if;
  else
    v_languages := v_j.idiomas;
  end if;

  if p_dados ? 'estado_civil' and p_dados->>'estado_civil' not in ('nao_informado','solteiro','casado') then
    raise exception 'Estado civil inválido';
  end if;
  if coalesce(p_dados->>'estado_civil',v_j.estado_civil) = 'casado'
     and coalesce(nullif(p_dados->>'data_casamento',''),v_j.data_casamento::text) is null then
    raise exception 'Informe a data do casamento';
  end if;
  if coalesce(p_dados->>'estado_civil',v_j.estado_civil) <> 'casado' then
    p_dados := p_dados || jsonb_build_object('data_casamento','');
  end if;

  foreach v_key in array array[
    'nascimento','data_casamento','batismo_aguas','batismo_espirito_santo',
    'batismo_espirito','inicio_cpo','inicio_colaborador','inicio_obra','inicio_coordenacao_fju'
  ] loop
    if p_dados ? v_key then
      v_date := nullif(btrim(coalesce(p_dados->>v_key,'')),'');
      if v_date is not null and (
        v_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        or to_char(v_date::date,'YYYY-MM-DD') <> v_date
        or v_date::date > current_date
        or v_date::date < date '1900-01-01'
      ) then raise exception 'Data inválida no campo %',v_key; end if;
    end if;
  end loop;

  if length(coalesce(p_dados->>'endereco','')) > 350 or
     length(coalesce(p_dados->>'testemunho','')) > 10000 or
     length(coalesce(p_dados->>'observacoes','')) > 3000 then
    raise exception 'Texto excede o limite permitido';
  end if;
  if p_dados ? 'deseja_obra_altar' and jsonb_typeof(p_dados->'deseja_obra_altar') <> 'boolean' then
    raise exception 'Preferência do Altar inválida';
  end if;

  update public.fju_jovens set
    nome_completo = case when p_dados ? 'nome_completo' then btrim(p_dados->>'nome_completo') else nome_completo end,
    telefone = case when p_dados ? 'telefone' then nullif(btrim(p_dados->>'telefone'),'') else telefone end,
    nacionalidade_iso2 = case when p_dados ? 'nacionalidade_iso2' then nullif(btrim(p_dados->>'nacionalidade_iso2'),'') else nacionalidade_iso2 end,
    idiomas = v_languages,
    nascimento = case when p_dados ? 'nascimento' then nullif(p_dados->>'nascimento','')::date else nascimento end,
    estado_civil = coalesce(p_dados->>'estado_civil',estado_civil),
    data_casamento = case when p_dados ? 'data_casamento' then nullif(p_dados->>'data_casamento','')::date else data_casamento end,
    endereco = coalesce(p_dados->>'endereco',endereco),
    batismo_aguas = case when p_dados ? 'batismo_aguas' then nullif(p_dados->>'batismo_aguas','')::date else batismo_aguas end,
    batismo_espirito_santo = case when p_dados ? 'batismo_espirito_santo' then nullif(p_dados->>'batismo_espirito_santo','')::date else batismo_espirito_santo end,
    projetos = v_projects,
    deseja_obra_altar = coalesce((p_dados->>'deseja_obra_altar')::boolean,deseja_obra_altar),
    testemunho = coalesce(p_dados->>'testemunho',testemunho),
    atualizado_em = now()
  where id = v_j.id;

  v_extra := jsonb_build_object(
    'endereco',coalesce(p_dados->>'endereco',v_j.endereco,''),
    'testemunho',coalesce(p_dados->>'testemunho',v_j.testemunho,''),
    'observacoes',coalesce(p_dados->>'observacoes',''),
    'batismo_aguas',coalesce(p_dados->>'batismo_aguas',v_j.batismo_aguas::text,''),
    'batismo_espirito',coalesce(p_dados->>'batismo_espirito',''),
    'inicio_cpo',coalesce(p_dados->>'inicio_cpo',''),
    'inicio_colaborador',coalesce(p_dados->>'inicio_colaborador',''),
    'inicio_obra',coalesce(p_dados->>'inicio_obra',''),
    'inicio_coordenacao_fju',coalesce(p_dados->>'inicio_coordenacao_fju','')
  );
  insert into public.fju_fichas_complementos(jovem_id,dados,atualizado_por)
  values(v_j.id,public.fju_validar_dados_ficha_complementar(v_extra),v_uid)
  on conflict(jovem_id) do update
    set dados=excluded.dados,atualizado_por=excluded.atualizado_por,atualizado_em=now();

  update public.fju_edicoes_perfil_jovem set status='cancelada'
  where jovem_id=v_j.id and status='pendente';
end;
$function$


revoke all on function public.fju_salvar_meu_perfil(jsonb) from public, anon;
grant execute on function public.fju_salvar_meu_perfil(jsonb) to authenticated;
